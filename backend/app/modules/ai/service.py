import os
import json
import uuid
import math
import asyncio
import logging
from typing import Optional, List, Tuple
import pandas as pd
import numpy as np
from sqlalchemy import select, or_, and_, desc
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

logger = logging.getLogger(__name__)

from app.models.listing import Listing, ListingRevision, ListingMedia
from app.models.user import User
from app.modules.ai.schemas import (
    ValuationRequest,
    ValuationResponse,
    ValuationBreakdownItem,
    NaturalSearchRequest,
    NaturalSearchResponse,
    ExtractedCriteria,
    RecommendationRequest,
    GeminiExplanation,
    CarRecognitionResponse,
    CarRecognitionFromUrlRequest,
)
from app.modules.ai.gemini_client import gemini_client
from app.modules.listings.schemas import ListingListItemResponse
from app.shared.exceptions import ValidationException
from ml_training.preprocess import extract_variant

from app.modules.ai.valuation_engine import (
    get_optimized_artifacts as _get_optimized_artifacts,
    get_catboost_model as _get_catboost_model,
    normalize_brand_and_model as _normalize_brand_and_model,
    resolve_valuation_support as _resolve_valuation_support,
    infer_specs as _infer_specs,
    calculate_condition_adjustments as _calculate_condition_adjustments,
    get_conformal_rel_ratio,
    LUXURY_BRANDS,
)

_conformal_rel_ratio = get_conformal_rel_ratio()


class AIService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def estimate_valuation(self, req: ValuationRequest) -> ValuationResponse:
        """Estimate price based on trained CatBoost ML model, Conformal Residual intervals, and Gemini explanation."""
        model = _get_catboost_model()
        try:
            optimized, report = _get_optimized_artifacts()
        except (ImportError, OSError, ValueError, KeyError):
            return ValuationResponse(status="ERROR", model_version="unavailable",
                reason="Chưa có mô hình định giá và báo cáo kiểm thử phù hợp.")
        age = max(0, report["training_reference_year"] - req.manufacture_year)

        brand_norm, model_norm = _normalize_brand_and_model(req.brand, req.model)
        support, support_level = _resolve_valuation_support(report, brand_norm, model_norm)
        year_outside_support = not support["min_year"] - 1 <= req.manufacture_year <= support["max_year"] + 1
        odo_outside_support = req.odometer_km > max(300000, support["max_odo"] * 1.5)

        if model is not None or support["median_price_million"] < 1500:
            # Predict using trained CatBoost model with Model feature
            body_type = (req.body_type or "SEDAN").upper()
            fuel_type = (req.fuel_type or "GASOLINE").upper()
            location = "Hà Nội" if req.province_code == "01" else ("TP HCM" if req.province_code == "79" else "Khác")

            engine_unknown = req.engine_displacement is None or req.engine_displacement <= 0
            engine_disp = float(support["median_engine"]) if engine_unknown else req.engine_displacement
            _, is_imported = _infer_specs(
                brand_norm, model_norm, body_type, engine_disp, req.is_imported, req.origin
            )
            seats_val = float(req.seats) if req.seats else (7.0 if body_type in ["MPV", "SUV"] else 5.0)
            doors_val = float(req.doors) if req.doors else (2.0 if body_type == "COUPE" else (5.0 if body_type in ["HATCHBACK", "SUV", "CROSSOVER", "MPV"] else 4.0))

            row_data = {
                'Brand': brand_norm,
                'Model': model_norm,
                'Body_Type': body_type,
                'Fuel_Type': fuel_type,
                'Location_Region': location,
                'Age': age,
                'Odometer_Km': float(req.odometer_km or age * 15000),
                'Mileage_Unknown': bool(req.odometer_km == 0 and age > 1),
                'Engine_Displacement': engine_disp,
                'Engine_Unknown': engine_unknown,
                'Variant': extract_variant(
                    brand_norm, model_norm, f"{req.model} {req.variant or ''}"),
                'Seats': seats_val,
                'Doors': doors_val,
                'Is_Imported': is_imported,
            }

            use_optimized = support["median_price_million"] < 1500
            selected_model = optimized if use_optimized else model
            if selected_model is None:
                return ValuationResponse(status="ERROR", model_version="unavailable",
                    reason="Mô hình cho phân khúc giá này chưa sẵn sàng.")

            def _run_prediction():
                df = pd.DataFrame([row_data])
                for col in ['Brand', 'Model', 'Body_Type', 'Fuel_Type', 'Location_Region']:
                    df[col] = df[col].astype(str)
                if use_optimized:
                    cols = report["categorical_features"] + report["numerical_features"]
                    return float(np.expm1(selected_model.predict(df[cols])[0]))
                cols = ['Brand', 'Model', 'Body_Type', 'Fuel_Type', 'Location_Region',
                        'Age', 'Odometer_Km', 'Mileage_Unknown', 'Engine_Displacement',
                        'Seats', 'Doors', 'Is_Imported']
                return float(selected_model.predict(df[cols])[0])

            pred_raw = await asyncio.to_thread(_run_prediction)
            pred_million = max(50.0, pred_raw)  # min 50tr

            # Hiệu chỉnh phân khúc xe hạng sang & Option cao cấp (Luxury Tier & Trim Calibration)
            is_luxury = brand_norm.lower() in LUXURY_BRANDS
            trim_raw = f"{req.model} {req.variant or ''}".lower()
            luxury_trim_bonus = 0.0
            if any(t in trim_raw for t in ["amg", "maybach", "m-sport", "m sport", "gts", "turbo s", "turbo", "autobiography", "sv"]):
                luxury_trim_bonus = 0.20  # Bản hiệu năng cao/siêu sang: +20%
            elif any(t in trim_raw for t in ["f-sport", "f sport", "s-line", "s line", "cross country", "ultra luxury", "executive", "lwb"]):
                luxury_trim_bonus = 0.10  # Bản trang bị tiện nghi cao: +10%

            if is_luxury:
                # Bù đắp độ sụt giảm giá phi tuyến tính cho xe sang lướt
                luxury_age_factor = 1.15 if age <= 3 else (1.08 if age <= 6 else 1.0)
                pred_million = pred_million * (1.0 + luxury_trim_bonus) * luxury_age_factor

            estimated_val = int(round(pred_million * 1_000_000 / 5_000_000) * 5_000_000)

            # Proportional Conformal calibration interval (+/- q80 relative ratio)
            ratio = report["conformal_calibration"]["q90_relative_ratio"] if use_optimized else _conformal_rel_ratio
            ratio = max(ratio, {"EXACT": ratio, "SPARSE": .40, "BRAND": .50, "GLOBAL": .65}[support_level])
            if year_outside_support:
                ratio += .15
            if odo_outside_support:
                ratio += .10
            ratio = min(ratio, .90)
            low_million = max(40.0, pred_million * (1.0 - ratio))
            high_million = pred_million * (1.0 + ratio)
            interval_low = int(round(low_million * 1_000_000 / 5_000_000) * 5_000_000)
            interval_high = int(round(high_million * 1_000_000 / 5_000_000) * 5_000_000)
            model_tag = report["version"] if use_optimized else "CatBoost-v2.0"
        else:
            return ValuationResponse(status="ERROR", model_version="unavailable",
                reason="Mô hình cho phân khúc giá này chưa sẵn sàng.")

        ml_estimated_val = estimated_val
        market = None

        # Kích hoạt Dynamic Market Grounding (Gemini Live Search) đối với xe sang / giá trị cao
        if (pred_million >= 1200 or is_luxury or support_level in ("SPARSE", "BRAND", "GLOBAL")) and getattr(gemini_client, "api_key", None):
            try:
                prov_name = "Hà Nội" if req.province_code == "01" else ("TP.HCM" if req.province_code == "79" else "Việt Nam")
                market = await asyncio.wait_for(
                    gemini_client.research_market_valuation(
                        brand=req.brand,
                        model=req.model,
                        variant=req.variant,
                        year=req.manufacture_year,
                        odometer_km=req.odometer_km,
                        province=prov_name,
                        ml_price_vnd=ml_estimated_val,
                    ),
                    timeout=5.0,
                )
            except Exception as e:
                logger.debug(f"Gemini market research skipped: {e}")
                market = None

        if market and market.comparable_count >= 2 and market.median_price_vnd > 0:
            ml_weight = 0.35 if is_luxury else 0.50
            market_weight = 1.0 - ml_weight
            pred_million = (pred_million * ml_weight) + ((market.median_price_vnd / 1_000_000) * market_weight)
            low_million = max(40.0, (market.low_price_vnd / 1_000_000 * 0.7) + (low_million * 0.3))
            high_million = (market.high_price_vnd / 1_000_000 * 0.7) + (high_million * 0.3)

        # Lưu giá cơ sở thị trường (trước khi trừ tình trạng kỹ thuật)
        base_price_val = int(round(pred_million * 1_000_000 / 5_000_000) * 5_000_000)
        base_interval_low = int(round(low_million * 1_000_000 / 5_000_000) * 5_000_000)
        base_interval_high = int(round(high_million * 1_000_000 / 5_000_000) * 5_000_000)

        # Áp dụng Tầng Thẩm Định Kỹ Thuật (Automotive Appraisal Condition Multiplier)
        adjusted_val, condition_mult, total_adj_vnd, breakdown_items = _calculate_condition_adjustments(
            base_price_val, req
        )
        interval_low = int(round(base_interval_low * condition_mult / 5_000_000) * 5_000_000)
        interval_high = int(round(base_interval_high * condition_mult / 5_000_000) * 5_000_000)
        estimated_val = adjusted_val

        # Find similar listings in DB matching brand or model or general published inventory
        similar_stmt = (
            select(Listing)
            .options(
                selectinload(Listing.published_revision).selectinload(ListingRevision.media),
                selectinload(Listing.revisions).selectinload(ListingRevision.media),
                selectinload(Listing.seller),
            )
            .where(Listing.status == "PUBLISHED")
        )

        sim_conds = []
        if brand_norm and brand_norm.lower() not in ["other", "khác"]:
            sim_conds.append(ListingRevision.title.ilike(f"%{brand_norm}%"))
        if model_norm and model_norm.lower() not in ["other", "khác"]:
            sim_conds.append(ListingRevision.title.ilike(f"%{model_norm}%"))

        similar_stmt = similar_stmt.join(ListingRevision, Listing.published_revision_id == ListingRevision.id)
        if sim_conds:
            similar_stmt = similar_stmt.where(or_(*sim_conds))

        similar_stmt = similar_stmt.order_by(Listing.published_at.desc()).limit(4)
        sim_res = await self.db.execute(similar_stmt)
        sim_listings = sim_res.scalars().all()

        if len(sim_listings) == 0:
            fallback_stmt = (
                select(Listing)
                .options(
                    selectinload(Listing.published_revision).selectinload(ListingRevision.media),
                    selectinload(Listing.revisions).selectinload(ListingRevision.media),
                    selectinload(Listing.seller),
                )
                .where(Listing.status == "PUBLISHED")
                .order_by(Listing.published_at.desc())
                .limit(4)
            )
            fallback_res = await self.db.execute(fallback_stmt)
            sim_listings = fallback_res.scalars().all()

        similar_items = []
        for l in sim_listings:
            rev = l.published_revision or (l.revisions[0] if l.revisions else None)
            if not rev:
                continue
            media_list = rev.media or []
            primary_m = next((m for m in media_list if m.is_primary), None) or (media_list[0] if media_list else None)
            img_url = primary_m.url if primary_m else None
            s = l.seller
            similar_items.append(
                ListingListItemResponse(
                    id=l.id,
                    status=l.status,
                    title=rev.title,
                    price_vnd=rev.price_vnd,
                    manufacture_year=rev.manufacture_year,
                    odometer_km=rev.odometer_km,
                    body_type=rev.body_type,
                    fuel_type=rev.fuel_type,
                    transmission=rev.transmission,
                    province_code=rev.province_code,
                    primary_image_url=img_url,
                    seller_id=s.id if s else l.seller_user_id,
                    seller_name=s.display_name if s else "Người bán",
                    published_at=l.published_at,
                    created_at=l.created_at,
                )
            )

        if market:
            pos_factors = [f"Đối chiếu {market.comparable_count} tin thị trường có nguồn"]
            neg_factors = ["Giá tin đăng có thể khác giá giao dịch thực tế"]

            f_upper = (req.flood_status or "").upper()
            if f_upper in {"CONFIRMED", "SUBMERGED"}:
                neg_factors.append("Xe từng bị ngập nước / thủy kích - khấu trừ mạnh theo kiểm định kỹ thuật")
            elif f_upper in {"SUSPECTED", "MINOR"}:
                neg_factors.append("Xe có dấu hiệu nghi ngờ ngập nước - khấu trừ rủi ro ẩm sàn")

            a_upper = (req.accident_status or "").upper()
            if a_upper in {"MAJOR", "SEVERE"}:
                neg_factors.append("Xe từng đâm đụng ảnh hưởng khung gầm sắt-xi - khấu trừ giá trị")
            elif a_upper == "MODERATE":
                neg_factors.append("Xe từng va chạm móp méo thân vỏ phụ tùng")

            if req.engine_repaired is True:
                neg_factors.append("Động cơ đã từng rã máy / đại tu")
            if req.transmission_repaired is True:
                neg_factors.append("Hộp số đã từng rã máy / đại tu")

            if f_upper == "NONE" and a_upper == "NONE" and req.engine_repaired is False:
                pos_factors.append("Cam kết xe nguyên bản: không đâm đụng, không ngập nước, máy số zin")

            explanation = GeminiExplanation(
                summary=market.summary,
                positive_factors=pos_factors,
                negative_factors=neg_factors,
                market_advice="Đối chiếu phiên bản và tình trạng xe trước khi chốt giá.",
            )
        else:
            explanation = await gemini_client.explain_valuation(
                brand=req.brand,
                model=req.model,
                year=req.manufacture_year,
                odometer_km=req.odometer_km,
                estimated_price_vnd=estimated_val,
                allow_api=False,
                flood_status=req.flood_status,
                accident_status=req.accident_status,
                service_history=req.service_history,
                engine_repaired=req.engine_repaired,
                transmission_repaired=req.transmission_repaired,
            )

        reason_parts = {
            "EXACT": [],
            "SPARSE": ["Ít mẫu đúng dòng xe; kết quả được bổ trợ bởi mô hình toàn thị trường."],
            "BRAND": ["Chưa có mẫu đúng dòng xe; hệ thống suy luận từ xe cùng hãng và các đặc điểm kỹ thuật."],
            "GLOBAL": ["Hãng và dòng xe chưa có trong dữ liệu; hệ thống suy luận từ toàn bộ thị trường và đặc điểm kỹ thuật."],
        }[support_level]
        if year_outside_support:
            reason_parts.append("Đời xe nằm ngoài khoảng dữ liệu tham chiếu.")
        if odo_outside_support:
            reason_parts.append("ODO nằm ngoài khoảng dữ liệu tham chiếu.")
        if market:
            reason_parts.append(f"Giá đã được đối chiếu với {market.comparable_count} tin thị trường qua Gemini.")
        if total_adj_vnd != 0:
            adj_mil = abs(total_adj_vnd) / 1_000_000
            verb = "khấu trừ" if total_adj_vnd < 0 else "cộng thêm"
            reason_parts.append(f"Đã {verb} {adj_mil:,.0f} triệu VNĐ theo kết quả thẩm định kỹ thuật và lịch sử xe.")

        return ValuationResponse(
            status="PREDICTED",
            model_version=model_tag,
            estimated_price_vnd=estimated_val,
            base_price_vnd=base_price_val,
            condition_multiplier=condition_mult,
            total_condition_adjustment_vnd=total_adj_vnd,
            breakdown_items=breakdown_items,
            interval_low_vnd=interval_low,
            interval_high_vnd=interval_high,
            interval_method="EMPIRICAL_RELATIVE_INTERVAL_90PCT" if support_level == "EXACT" and not year_outside_support and not odo_outside_support else "HEURISTIC_WIDENED_INTERVAL",
            confidence_level="LOW" if support_level != "EXACT" or support["count"] < 30 or not use_optimized or engine_unknown or year_outside_support or odo_outside_support else "MEDIUM",
            reference_count=support["count"],
            ml_price_vnd=ml_estimated_val,
            gemini_market_price_vnd=market.median_price_vnd if market else None,
            pricing_method="ML_GEMINI_GROUNDED" if market else "ML_ONLY",
            market_sources=market.sources if market else [],
            reason=" ".join(reason_parts) or None,
            similar_listings=similar_items,
            explanation=explanation,
        )

    async def natural_search(self, query: str) -> NaturalSearchResponse:
        criteria = await gemini_client.parse_natural_search(query)

        stmt = (
            select(Listing, ListingRevision, User)
            .join(ListingRevision, Listing.published_revision_id == ListingRevision.id)
            .join(User, Listing.seller_user_id == User.id)
            .where(Listing.status == "PUBLISHED")
        )

        if criteria.body_type:
            stmt = stmt.where(ListingRevision.body_type == criteria.body_type.upper())
        if criteria.fuel_type:
            stmt = stmt.where(ListingRevision.fuel_type == criteria.fuel_type.upper())
        if criteria.max_price_vnd:
            stmt = stmt.where(ListingRevision.price_vnd <= criteria.max_price_vnd)
        if criteria.min_price_vnd:
            stmt = stmt.where(ListingRevision.price_vnd >= criteria.min_price_vnd)
        if criteria.min_year:
            stmt = stmt.where(ListingRevision.manufacture_year >= criteria.min_year)
        if criteria.max_year:
            stmt = stmt.where(ListingRevision.manufacture_year <= criteria.max_year)
        if criteria.brand:
            stmt = stmt.where(ListingRevision.title.ilike(f"%{criteria.brand}%"))
        if criteria.model:
            stmt = stmt.where(ListingRevision.title.ilike(f"%{criteria.model}%"))

        stmt = stmt.order_by(desc(Listing.published_at)).limit(20)
        res = await self.db.execute(stmt)
        rows = res.all()

        results = []
        for l, rev, s in rows:
            results.append(
                ListingListItemResponse(
                    id=l.id,
                    status=l.status,
                    title=rev.title,
                    price_vnd=rev.price_vnd,
                    manufacture_year=rev.manufacture_year,
                    odometer_km=rev.odometer_km,
                    body_type=rev.body_type,
                    fuel_type=rev.fuel_type,
                    transmission=rev.transmission,
                    province_code=rev.province_code,
                    primary_image_url=None,
                    seller_id=s.id,
                    seller_name=s.display_name,
                    published_at=l.published_at,
                    created_at=l.created_at,
                )
            )

        return NaturalSearchResponse(
            original_query=query,
            extracted_criteria=criteria,
            results=results,
            total_found=len(results),
        )

    async def recommend_listings(self, req: RecommendationRequest) -> List[ListingListItemResponse]:
        stmt = (
            select(Listing, ListingRevision, User)
            .join(ListingRevision, Listing.published_revision_id == ListingRevision.id)
            .join(User, Listing.seller_user_id == User.id)
            .where(Listing.status == "PUBLISHED")
        )

        if req.max_budget_vnd:
            stmt = stmt.where(ListingRevision.price_vnd <= req.max_budget_vnd)
        if req.preferred_body_types:
            stmt = stmt.where(ListingRevision.body_type.in_([b.upper() for b in req.preferred_body_types]))

        stmt = stmt.order_by(desc(Listing.views_count), desc(Listing.published_at)).limit(req.limit)
        res = await self.db.execute(stmt)
        rows = res.all()

        results = []
        for l, rev, s in rows:
            results.append(
                ListingListItemResponse(
                    id=l.id,
                    status=l.status,
                    title=rev.title,
                    price_vnd=rev.price_vnd,
                    manufacture_year=rev.manufacture_year,
                    odometer_km=rev.odometer_km,
                    body_type=rev.body_type,
                    fuel_type=rev.fuel_type,
                    transmission=rev.transmission,
                    province_code=rev.province_code,
                    primary_image_url=None,
                    seller_id=s.id,
                    seller_name=s.display_name,
                    published_at=l.published_at,
                    created_at=l.created_at,
                )
            )
        return results

    async def recognize_car_from_image(
        self,
        image_bytes: bytes,
        mime_type: str = "image/jpeg",
        filename: Optional[str] = None,
    ) -> CarRecognitionResponse:
        """Process vehicle photo with Gemini Vision and optionally persist in media storage."""
        recognition = await gemini_client.recognize_car_from_image(image_bytes, mime_type)

        # Upload image to media service to have immediate URL for listing
        try:
            from app.modules.media.service import CloudinaryMediaService
            import io

            media_srv = CloudinaryMediaService()
            file_obj = io.BytesIO(image_bytes)
            fname = filename or f"car_ai_{uuid.uuid4().hex[:8]}.jpg"
            upload_res = await media_srv.upload_image(file_obj, fname, folder="ai_recognition")
            if upload_res and upload_res.url:
                recognition.image_url = upload_res.url
        except Exception as e:
            logger.warning("Could not persist uploaded AI recognition image: %s", e)

        return recognition

    async def recognize_car_from_url_or_base64(
        self,
        req: CarRecognitionFromUrlRequest,
    ) -> CarRecognitionResponse:
        """Process car recognition when given an image URL or base64 string."""
        import base64
        import socket
        import ipaddress
        import urllib.parse
        import httpx

        if req.image_base64:
            b64_str = req.image_base64
            mime_type = "image/jpeg"
            if "," in b64_str:
                header, b64_str = b64_str.split(",", 1)
                if "png" in header:
                    mime_type = "image/png"
                elif "webp" in header:
                    mime_type = "image/webp"
            img_bytes = base64.b64decode(b64_str)
            return await self.recognize_car_from_image(img_bytes, mime_type)

        if req.image_url:
            parsed = urllib.parse.urlparse(req.image_url)
            if parsed.scheme not in ("http", "https") or not parsed.hostname:
                raise ValidationException("URL hình ảnh phải sử dụng giao thức http hoặc https hợp lệ.")

            try:
                addr_info = socket.getaddrinfo(parsed.hostname, None)
                for entry in addr_info:
                    ip_str = entry[4][0]
                    ip = ipaddress.ip_address(ip_str)
                    if ip.is_private or ip.is_loopback or ip.is_link_local or ip.is_reserved or ip.is_multicast or ip.is_unspecified:
                        raise ValidationException("Địa chỉ mạng của URL không được phép truy cập (IP nội bộ hoặc không hợp lệ).")
            except socket.gaierror:
                raise ValidationException("Không thể phân giải tên miền hình ảnh.")

            async with httpx.AsyncClient(timeout=15.0) as client:
                resp = await client.get(req.image_url, follow_redirects=False)
                if resp.status_code == 200:
                    if len(resp.content) > 15 * 1024 * 1024:
                        raise ValidationException("Dung lượng ảnh tải về vượt quá giới hạn 15MB.")
                    mime = resp.headers.get("content-type", "image/jpeg")
                    return await self.recognize_car_from_image(resp.content, mime, filename="url_car.jpg")
                else:
                    raise ValidationException(f"Không thể tải ảnh từ URL (HTTP {resp.status_code}).")

        return CarRecognitionResponse(
            confidence_score=0.0,
            notes="Vui lòng cung cấp file ảnh, image_url hoặc image_base64 hợp lệ.",
        )

