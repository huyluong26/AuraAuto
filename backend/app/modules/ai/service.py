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
from ml_training.preprocess import extract_variant

# Global CatBoost Model & Metadata Singleton
_catboost_model = None
_conformal_rel_ratio = 0.2134  # Relative 80% conformal coverage from evaluation report (21.34%)
_optimized_model = None
_optimized_report = None


def _get_optimized_artifacts(version: str = "v3"):
    global _optimized_model, _optimized_report
    if _optimized_model is None or _optimized_report is None:
        import catboost as cb
        from pathlib import Path
        base = Path(__file__).resolve().parents[3] / "ml_training" / "artifacts"
        model_file = base / f"catboost_log_price_{version}.cbm"
        report_file = base / f"evaluation_report_{version}.json"
        if not model_file.exists() or not report_file.exists():
            model_file = base / "catboost_log_price_v3.cbm"
            report_file = base / "evaluation_report_v3.json"
        model = cb.CatBoostRegressor()
        model.load_model(str(model_file))
        report = json.loads(report_file.read_text(encoding="utf-8"))
        _optimized_model, _optimized_report = model, report
    return _optimized_model, _optimized_report

def _get_catboost_model():
    global _catboost_model, _conformal_rel_ratio
    if _catboost_model is None:
        try:
            import catboost as cb
            # Check model paths
            model_paths = [
                os.path.join(os.getcwd(), "ml_training", "artifacts", "catboost_used_cars.cbm"),
                os.path.join(os.getcwd(), "backend", "ml_training", "artifacts", "catboost_used_cars.cbm"),
                "/app/ml_training/artifacts/catboost_used_cars.cbm",
            ]
            for p in model_paths:
                if os.path.exists(p):
                    model = cb.CatBoostRegressor()
                    model.load_model(p)
                    _catboost_model = model
                    break

            # Load report metadata if present
            report_paths = [
                os.path.join(os.getcwd(), "ml_training", "artifacts", "evaluation_report.json"),
                os.path.join(os.getcwd(), "backend", "ml_training", "artifacts", "evaluation_report.json"),
                "/app/ml_training/artifacts/evaluation_report.json",
            ]
            for rp in report_paths:
                if os.path.exists(rp):
                    with open(rp, "r", encoding="utf-8") as f:
                        data = json.load(f)
                        calib = data.get("conformal_calibration", {})
                        if "q90_relative_ratio" in calib:
                            _conformal_rel_ratio = float(calib["q90_relative_ratio"])
                    break
        except Exception:
            _catboost_model = None
    return _catboost_model


def _normalize_brand_and_model(brand_input: str, model_input: str) -> Tuple[str, str]:
    try:
        from ml_training.preprocess import normalize_brand, extract_model
        b = normalize_brand(brand_input)
        # The UI may send either "CX-5" or "Mazda CX-5".
        # extract_model already removes the brand prefix when it is present.
        m = extract_model(b, model_input)
        return b, m
    except Exception:
        # Fallback if ml_training not directly importable
        b = (brand_input or "Other").strip().title()
        if "mercedes" in b.lower():
            b = "Mercedes-Benz"
        m = (model_input or "Other").strip().title()
        return b, m


def _resolve_valuation_support(report: dict, brand: str, model: str) -> Tuple[dict, str]:
    """Use the narrowest available reference group without refusing a valuation."""
    groups = report["support_by_brand_model"]
    exact = groups.get(f"{brand}|{model}")
    if exact:
        return exact, "EXACT" if exact["count"] >= 10 else "SPARSE"

    brand_groups = [value for key, value in groups.items() if key.startswith(f"{brand}|")]
    candidates = brand_groups or list(groups.values())
    level = "BRAND" if brand_groups else "GLOBAL"
    total = sum(item["count"] for item in candidates)

    def weighted_average(field: str) -> float:
        return sum(item[field] * item["count"] for item in candidates) / total

    return {
        "count": total,
        "min_year": min(item["min_year"] for item in candidates),
        "max_year": max(item["max_year"] for item in candidates),
        "max_odo": max(item["max_odo"] for item in candidates),
        "median_engine": weighted_average("median_engine"),
        "median_price_million": weighted_average("median_price_million"),
    }, level


def _infer_specs(brand_norm: str, model_norm: str, body_type: str, user_disp: Optional[float], user_imported: Optional[int], origin: Optional[str]) -> Tuple[float, int]:
    # 1. Engine displacement
    disp = user_disp
    if not disp or disp <= 0.5:
        m = model_norm.lower()
        if any(k in m for k in ["morning", "i10", "fadil", "wigo", "brio", "spark", "matiz"]):
            disp = 1.2
        elif any(k in m for k in ["vios", "accent", "city", "soluto", "yaris", "raize", "mazda 2", "attrage", "almera"]):
            disp = 1.5
        elif any(k in m for k in ["civic", "corolla altis", "elantra", "k3", "cerato", "mazda 3", "lux a"]):
            disp = 1.8
        elif any(k in m for k in ["camry", "k5", "mazda 6", "accord", "sonata"]):
            disp = 2.5
        elif any(k in m for k in ["cx-5", "tucson", "sportage", "cr-v", "c-class", "glc", "3 series", "x3", "q5"]):
            disp = 2.0
        elif any(k in m for k in ["santafe", "sorento", "everest", "ranger", "carnival", "sedona", "fortuner", "hilux", "triton"]):
            disp = 2.2
        elif any(k in m for k in ["prado", "explorer", "rx", "gle", "e-class", "5 series"]):
            disp = 2.7
        elif any(k in m for k in ["land cruiser", "lx", "gls", "s-class", "7 series", "cayenne", "range rover"]):
            disp = 4.0
        elif body_type in ["HATCHBACK"]:
            disp = 1.2
        elif body_type in ["SEDAN"]:
            disp = 1.6
        elif body_type in ["SUV", "PICKUP", "MPV"]:
            disp = 2.2
        else:
            disp = 2.0

    # 2. Origin / Imported status
    if user_imported is not None:
        imported = 1 if user_imported else 0
    elif origin and "nhập" in origin.lower():
        imported = 1
    elif origin and ("lắp ráp" in origin.lower() or "trong nước" in origin.lower()):
        imported = 0
    else:
        m = model_norm.lower()
        b = brand_norm.lower()
        if b in ["lexus", "porsche", "audi", "land rover", "volvo", "rolls-royce", "bentley", "ferrari"]:
            imported = 1
        elif any(k in m for k in ["land cruiser", "alphard", "prado", "raize", "everest", "explorer", "ranger raptor", "camry"]):
            imported = 1
        else:
            imported = 0

    return float(disp), imported


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
            explanation = GeminiExplanation(
                summary=market.summary,
                positive_factors=[f"Đối chiếu {market.comparable_count} tin thị trường có nguồn"],
                negative_factors=["Giá tin đăng có thể khác giá giao dịch thực tế"],
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

        return ValuationResponse(
            status="PREDICTED",
            model_version=model_tag,
            estimated_price_vnd=estimated_val,
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
            async with httpx.AsyncClient(timeout=20.0) as client:
                resp = await client.get(req.image_url)
                if resp.status_code == 200:
                    mime = resp.headers.get("content-type", "image/jpeg")
                    return await self.recognize_car_from_image(resp.content, mime, filename="url_car.jpg")

        return CarRecognitionResponse(
            confidence_score=0.0,
            notes="Vui lòng cung cấp file ảnh, image_url hoặc image_base64 hợp lệ.",
        )

