import re
import json
import logging
import time
from typing import Optional
import httpx

from app.core.config import settings
from app.modules.ai.schemas import (
    ExtractedCriteria,
    GeminiExplanation,
    GeminiMarketValuation,
    MarketSource,
    CarRecognitionResponse,
)

logger = logging.getLogger(__name__)


class GeminiClient:
    def __init__(self):
        self.api_key = getattr(settings, "GEMINI_API_KEY", "") or ""
        self.preferred_models = [
            "gemini-3-flash-preview",
            "gemini-3.1-flash-lite",
            "gemini-flash-latest",
        ]
        self._quota_cooldown_until = 0.0
        self._market_cache: dict[tuple, tuple[float, GeminiMarketValuation]] = {}
        self._client: Optional[httpx.AsyncClient] = None

    def _get_client(self, timeout: float = 12.0) -> httpx.AsyncClient:
        if self._client is None or self._client.is_closed:
            self._client = httpx.AsyncClient(timeout=timeout)
        return self._client

    async def aclose(self):
        if self._client and not self._client.is_closed:
            await self._client.aclose()

    async def _call_gemini_api(self, payload: dict, timeout: float = 12.0) -> Optional[dict]:
        """Call Gemini API with appropriate timeout to support multimodal vision and text."""
        if not self.api_key or time.monotonic() < self._quota_cooldown_until:
            return None

        client = self._get_client(timeout=timeout)
        rate_limited = False
        for model in self.preferred_models:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={self.api_key}"
            try:
                resp = await client.post(
                    url,
                    headers={"Content-Type": "application/json", "x-goog-api-key": self.api_key},
                    json=payload,
                )
                if resp.status_code == 200:
                    return resp.json()
                if resp.status_code == 429:
                    rate_limited = True
                error_status = "unknown"
                error_message = "No error message"
                try:
                    error = resp.json().get("error", {})
                    error_status = str(error.get("status") or error_status)
                    error_message = " ".join(str(error.get("message") or error_message).split())[:500]
                except (TypeError, ValueError):
                    pass
                logger.warning(
                    "Gemini model %s returned HTTP %s (%s): %s",
                    model,
                    resp.status_code,
                    error_status,
                    error_message,
                )
            except httpx.HTTPError as exc:
                logger.warning("Gemini request failed for model %s: %s", model, exc)
                continue
        if rate_limited:
            self._quota_cooldown_until = time.monotonic() + 60
        return None

    async def parse_natural_search(self, query: str) -> ExtractedCriteria:
        """Parse natural Vietnamese search query into structured criteria using Gemini or fallback."""
        if self.api_key:
            try:
                system_instruction = (
                    "Bạn là chuyên gia phân tích câu tìm kiếm xe ô tô bằng tiếng Việt. "
                    "Hãy phân tích câu của người dùng và trả về DUY NHẤT một chuỗi JSON hợp lệ không bọc trong markdown code fence, với các trường: "
                    "brand (chuỗi tiếng Anh/tên hãng xe, vd: 'Toyota', 'Mazda'), "
                    "model (tên dòng xe, vd: 'Vios', 'CX-5'), "
                    "body_type (một trong các giá trị: 'SEDAN', 'SUV', 'MPV', 'HATCHBACK', 'PICKUP', 'COUPE' hoặc null), "
                    "fuel_type (một trong: 'GASOLINE', 'DIESEL', 'HYBRID', 'ELECTRIC' hoặc null), "
                    "transmission ('AUTOMATIC', 'MANUAL' hoặc null), "
                    "min_price_vnd (số nguyên VNĐ hoặc null), "
                    "max_price_vnd (số nguyên VNĐ hoặc null. Chú ý: 'dưới 700 triệu' nghĩa là max_price_vnd = 700000000, 'tầm 1 tỷ' nghĩa là max_price_vnd = 1000000000), "
                    "min_year (số nguyên năm hoặc null. Chú ý: 'đời từ 2021' nghĩa là min_year = 2021), "
                    "max_year (số nguyên năm hoặc null), "
                    "max_km (số nguyên km hoặc null)."
                )

                payload = {
                    "contents": [
                        {
                            "role": "user",
                            "parts": [{"text": f"{system_instruction}\n\nCâu tìm kiếm: {query}"}]
                        }
                    ],
                    "generationConfig": {
                        "responseMimeType": "application/json",
                    }
                }

                data = await self._call_gemini_api(payload, timeout=1.5)
                if data:
                    text = data["candidates"][0]["content"]["parts"][0]["text"].strip()
                    parsed = json.loads(text)
                    return ExtractedCriteria(**parsed)
            except Exception:
                pass  # Fall back to rule-based parser

        return self._fallback_rule_based_parse(query)

    def _fallback_rule_based_parse(self, query: str) -> ExtractedCriteria:
        """Rule-based regex parser fallback for Vietnamese queries."""
        q = query.lower()
        criteria = ExtractedCriteria()

        # Body type detection
        if "suv" in q:
            criteria.body_type = "SUV"
        elif "sedan" in q:
            criteria.body_type = "SEDAN"
        elif "hatchback" in q:
            criteria.body_type = "HATCHBACK"
        elif "bán tải" in q or "pickup" in q:
            criteria.body_type = "PICKUP"
        elif "mpv" in q or "7 chỗ" in q:
            criteria.body_type = "MPV"

        # Brand detection
        brands = ["toyota", "hyundai", "kia", "mazda", "ford", "honda", "mitsubishi", "vinfast", "mercedes", "bmw"]
        for b in brands:
            if b in q:
                criteria.brand = b.capitalize()
                break

        # Max price detection (ví dụ: dưới 600 triệu, tầm 800tr, < 1 tỷ)
        price_match = re.search(r'(?:dưới|<|khoảng|tầm)\s*(\d+(?:[.,]\d+)?)\s*(triệu|tr|tỷ)', q)
        if price_match:
            val = float(price_match.group(1).replace(",", "."))
            unit = price_match.group(2)
            if "tỷ" in unit:
                criteria.max_price_vnd = int(val * 1_000_000_000)
            else:
                criteria.max_price_vnd = int(val * 1_000_000)

        # Min year detection (ví dụ: đời từ 2020, năm 2021 trở lên)
        year_match = re.search(r'(?:đời|năm)\s*(?:từ|>|>=)?\s*(20\d\d)', q)
        if year_match:
            criteria.min_year = int(year_match.group(1))

        # Fuel type
        if "máy dầu" in q or "diesel" in q:
            criteria.fuel_type = "DIESEL"
        elif "xăng" in q:
            criteria.fuel_type = "GASOLINE"
        elif "điện" in q:
            criteria.fuel_type = "ELECTRIC"

        return criteria

    async def explain_valuation(
        self,
        brand: str,
        model: str,
        year: int,
        odometer_km: int,
        estimated_price_vnd: int,
        allow_api: bool = True,
        flood_status: Optional[str] = None,
        accident_status: Optional[str] = None,
        service_history: Optional[str] = None,
        engine_repaired: Optional[bool] = None,
        transmission_repaired: Optional[bool] = None,
    ) -> GeminiExplanation:
        """Provide detailed explanation on valuation factors."""
        price_in_million = round(estimated_price_vnd / 1_000_000)

        cond_lines = []
        f_upper = (flood_status or "").upper()
        if f_upper in {"CONFIRMED", "SUBMERGED"}:
            cond_lines.append("- Tình trạng: Xe từng bị ngập nước / thủy kích.")
        elif f_upper in {"SUSPECTED", "MINOR"}:
            cond_lines.append("- Tình trạng: Xe có dấu hiệu nghi ngờ ngập nước.")
        elif f_upper == "NONE":
            cond_lines.append("- Tình trạng: Cam kết không ngập nước.")

        a_upper = (accident_status or "").upper()
        if a_upper in {"MAJOR", "SEVERE"}:
            cond_lines.append("- Tai nạn: Đâm đụng biến dạng kết cấu khung gầm sắt-xi.")
        elif a_upper == "MODERATE":
            cond_lines.append("- Tai nạn: Va chạm móp méo thân vỏ phụ tùng.")
        elif a_upper in {"MINOR", "LIGHT"}:
            cond_lines.append("- Tai nạn: Xước xát nhẹ thân vỏ ngoài da.")
        elif a_upper == "NONE":
            cond_lines.append("- Tai nạn: Cam kết nguyên bản, không đâm đụng.")

        if engine_repaired is True:
            cond_lines.append("- Động cơ: Đã từng rã máy / đại tu.")
        if transmission_repaired is True:
            cond_lines.append("- Hộp số: Đã từng rã máy / đại tu.")
        s_upper = (service_history or "").upper()
        if s_upper in {"FULL", "FULL_DEALER"}:
            cond_lines.append("- Bảo dưỡng: Đầy đủ sổ bảo dưỡng hãng.")
        elif s_upper in {"NONE", "IRREGULAR"}:
            cond_lines.append("- Bảo dưỡng: Không có hồ sơ bảo dưỡng định kỳ rõ ràng.")

        cond_text = ("\nThông tin kiểm định kỹ thuật:\n" + "\n".join(cond_lines)) if cond_lines else ""

        if self.api_key and allow_api:
            try:
                prompt = (
                    f"Giải thích mức định giá chiếc xe ô tô cũ: {brand} {model}, năm sản xuất: {year}, số km đã đi: {odometer_km} km. "
                    f"Giá dự đoán của mô hình: {price_in_million} triệu VNĐ.{cond_text}\n"
                    "Trả về JSON với các trường:\n"
                    "summary: tóm tắt 1-2 câu về mức giá này,\n"
                    "positive_factors: mảng 2-3 chuỗi điểm cộng giữ giá,\n"
                    "negative_factors: mảng 2-3 chuỗi điểm hao mòn hoặc mất giá,\n"
                    "market_advice: 1 câu lời khuyên cho người mua/bán."
                )
                payload = {
                    "contents": [{"role": "user", "parts": [{"text": prompt}]}],
                    "generationConfig": {"responseMimeType": "application/json"}
                }
                data = await self._call_gemini_api(payload, timeout=1.5)
                if data:
                    text = data["candidates"][0]["content"]["parts"][0]["text"].strip()
                    return GeminiExplanation(**json.loads(text))
            except Exception:
                pass

        # Rule-based fallback
        age = max(1, 2026 - year)
        avg_km_per_year = odometer_km / age if age > 0 else odometer_km

        positive = []
        negative = []

        if age <= 3:
            positive.append(f"Xe đời mới ({year}), công nghệ hiện đại và kiểu dáng chưa lỗi mốt")
        if avg_km_per_year < 15000:
            positive.append(f"Số km trung bình ({int(avg_km_per_year):,} km/năm) thuộc nhóm đi ít, giữ xe")
        
        b_lower = brand.lower()
        if b_lower in ["toyota", "honda"]:
            positive.append(f"Thương hiệu {brand} giữ giá vượt trội, thanh khoản cao và phụ tùng sẵn có")
        elif b_lower in ["mercedes-benz", "bmw", "porsche", "audi", "lexus"]:
            positive.append(f"Dòng xe hạng sang {brand} khẳng định đẳng cấp, cảm giác lái và độ an toàn vượt bậc")
        elif b_lower == "vinfast":
            positive.append(f"Thương hiệu xe Việt {brand} tối ưu chi phí vận hành và bảo hành vượt trội")
        elif b_lower in ["mazda", "kia", "hyundai"]:
            positive.append(f"Dòng xe {brand} sở hữu thiết kế thời thượng và nhiều trang bị tiện nghi")
        elif b_lower == "ford":
            positive.append(f"Thương hiệu {brand} khung gầm đầm chắc và động cơ mạnh mẽ")

        if age > 5:
            negative.append(f"Xe đã qua {age} năm sử dụng, cần kiểm tra hao mòn linh kiện định kỳ")
        if avg_km_per_year > 25000:
            negative.append("Số km di chuyển cao hơn mức trung bình gia đình")

        # Thẩm định yếu tố kỹ thuật thực tế
        if f_upper in {"CONFIRMED", "SUBMERGED"}:
            negative.append("Xe từng bị ngập nước / thủy kích - tiềm ẩn rủi ro chập cháy hệ thống điện tử và mục gầm")
        elif f_upper in {"SUSPECTED", "MINOR"}:
            negative.append("Xe có dấu hiệu nghi ngờ ngập nước - cần kiểm tra kỹ giắc điện và sàn xe")

        if a_upper in {"MAJOR", "SEVERE"}:
            negative.append("Xe từng đâm đụng tổn hại kết cấu khung sườn sắt-xi chịu lực")
        elif a_upper == "MODERATE":
            negative.append("Xe từng va chạm biến dạng thân vỏ, đã nắn chỉnh lại các chi tiết")

        if engine_repaired is True:
            negative.append("Động cơ đã từng rã máy / đại tu, làm mất giá trị máy nguyên bản")
        if transmission_repaired is True:
            negative.append("Hộp số đã từng rã đại tu / sửa chữa")

        if s_upper in {"FULL", "FULL_DEALER"}:
            positive.append("Lịch sử bảo dưỡng chính hãng đầy đủ 100%, máy móc vận hành tin cậy")
        elif s_upper in {"NONE", "IRREGULAR"}:
            negative.append("Lịch sử bảo dưỡng chưa rõ ràng, cần kiểm tra dự phòng tổng thể")

        if f_upper == "NONE" and a_upper == "NONE" and engine_repaired is False:
            positive.append("Cam kết xe nguyên bản: không đâm đụng, không ngập nước, máy số zin")

        if price_in_million >= 1000:
            price_str = f"{price_in_million / 1000:.2f}".rstrip("0").rstrip(".") + " tỷ VNĐ"
        else:
            price_str = f"{price_in_million} triệu VNĐ"

        return GeminiExplanation(
            summary=f"Mức giá tham khảo khoảng {price_str} phản ánh đúng giá trị thị trường của {brand} {model} đời {year}.",
            positive_factors=positive or [f"Mức giá phổ biến cho xe {brand} {model}"],
            negative_factors=negative or ["Hao mòn tự nhiên theo thời gian sử dụng"],
            market_advice="Nên kiểm tra trực tiếp tình trạng khung gầm, máy móc và lịch sử bảo dưỡng trước khi giao dịch.",
        )

    async def research_market_valuation(
        self,
        *,
        brand: str,
        model: str,
        variant: Optional[str],
        year: int,
        odometer_km: int,
        province: Optional[str],
        ml_price_vnd: int,
    ) -> Optional[GeminiMarketValuation]:
        """Search current Vietnamese listings; reject ungrounded or malformed prices."""
        if not self.api_key:
            return None
        cache_key = (brand.lower(), model.lower(), (variant or "").lower(), year,
                     round(odometer_km, -4), province or "", round(ml_price_vnd, -7))
        cached = self._market_cache.get(cache_key)
        if cached and time.monotonic() - cached[0] < 1800:
            return cached[1]
        prompt = (
            "Tìm các tin đăng bán ô tô cũ đang công khai tại Việt Nam tương đồng với xe sau. "
            f"Xe: {brand} {model} {variant or ''}, đời {year}, ODO {odometer_km} km, khu vực {province or 'Việt Nam'}. "
            f"Giá mô hình nội bộ chỉ để đối chiếu: {ml_price_vnd} VNĐ. "
            "Chỉ dùng giá xe cũ từ các tin có thể kiểm chứng; bỏ xe mới, giá trả góp, giá đặt cọc, tin trùng và tin sai phiên bản. "
            "Nếu thiếu dữ liệu hãy đặt comparable_count=0. Trả về đúng một JSON không markdown gồm: "
            "median_price_vnd, low_price_vnd, high_price_vnd (số nguyên VNĐ), comparable_count (số tin thực sự dùng), "
            "confidence (HIGH, MEDIUM hoặc LOW), summary (một câu tiếng Việt)."
        )
        payload = {
            "contents": [{"role": "user", "parts": [{"text": prompt}]}],
            "tools": [{"google_search": {}}],
        }
        try:
            data = await self._call_gemini_api(payload, timeout=8.0)
            if not data:
                return None
            candidate = data["candidates"][0]
            text = candidate["content"]["parts"][0]["text"].strip()
            match = re.search(r"\{.*\}", text, flags=re.DOTALL)
            if not match:
                return None
            parsed = json.loads(match.group())
            chunks = candidate.get("groundingMetadata", {}).get("groundingChunks", [])
            sources = []
            seen = set()
            for chunk in chunks:
                web = chunk.get("web", {})
                url = web.get("uri")
                if url and url not in seen:
                    sources.append(MarketSource(title=web.get("title") or "Nguồn thị trường", url=url))
                    seen.add(url)
            median = int(parsed.get("median_price_vnd") or 0)
            low = int(parsed.get("low_price_vnd") or 0)
            high = int(parsed.get("high_price_vnd") or 0)
            count = int(parsed.get("comparable_count") or 0)
            confidence = str(parsed.get("confidence") or "LOW").upper()
            if len(sources) < 2 or count < 2 or not 50_000_000 <= low <= median <= high <= 50_000_000_000:
                return None
            result = GeminiMarketValuation(
                median_price_vnd=median,
                low_price_vnd=low,
                high_price_vnd=high,
                comparable_count=count,
                confidence=confidence if confidence in {"HIGH", "MEDIUM", "LOW"} else "LOW",
                summary=str(parsed.get("summary") or "Giá tham khảo từ các tin đăng thị trường hiện tại."),
                sources=sources[:5],
            )
            if len(self._market_cache) >= 200:
                self._market_cache.clear()
            self._market_cache[cache_key] = (time.monotonic(), result)
            return result
        except (KeyError, TypeError, ValueError, json.JSONDecodeError):
            return None

    async def recognize_car_from_image(
        self, image_bytes: bytes, mime_type: str = "image/jpeg"
    ) -> CarRecognitionResponse:
        """Analyze vehicle photo using Gemini Vision and extract structured car specifications."""
        import base64

        if not self.api_key:
            return CarRecognitionResponse(
                confidence_score=0.0,
                notes="Chưa cấu hình GEMINI_API_KEY trên hệ thống",
            )

        b64_img = base64.b64encode(image_bytes).decode("utf-8")
        prompt = (
            "Bạn là chuyên gia thẩm định và định danh xe ô tô hàng đầu tại Việt Nam. "
            "Hãy phân tích kỹ bức ảnh (chụp xe thực tế, ngoại thất, nội thất, đồng hồ taplo hoặc giấy đăng ký xe cavet). "
            "Nhận diện chính xác các thông tin của xe và trả về DUY NHẤT một chuỗi JSON hợp lệ không bọc trong markdown code fence, với cấu trúc sau:\n"
            "{\n"
            '  "brand": "Tên thương hiệu xe chuẩn (vd: Toyota, Mazda, Honda, Mercedes-Benz, Hyundai, Kia, Ford, VinFast, BMW, Mitsubishi, Lexus, Audi, Porsche...)",\n'
            '  "model": "Tên dòng xe chuẩn (vd: Vios, CX-5, City, C-Class, SantaFe, Seltos, Ranger, VF 8, Tucson, GLC...)",\n'
            '  "trim": "Phiên bản xe nếu nhận diện được (vd: 1.5G, 2.0 Premium, C200, Turbo, RS, 4x4 AT...) hoặc null",\n'
            '  "manufacture_year": số nguyên năm sản xuất ước tính (vd: 2022) hoặc null,\n'
            '  "body_type": "Một trong các giá trị: SEDAN, SUV, HATCHBACK, PICKUP, MPV, COUPE hoặc null",\n'
            '  "color": "Màu sắc ngoại thất tiếng Việt (vd: Trắng, Đen, Đỏ, Bạc, Xám, Xanh, Nâu, Vàng cát...)",\n'
            '  "fuel_type": "Một trong: GASOLINE, DIESEL, ELECTRIC, HYBRID hoặc null",\n'
            '  "transmission": "AUTOMATIC hoặc MANUAL hoặc null",\n'
            '  "seats": số chỗ ngồi ước tính (số nguyên: 4, 5, 7, 8) hoặc null,\n'
            '  "odometer_km": số km đã đi nếu chụp rõ mặt đồng hồ taplo ODO hoặc null,\n'
            '  "confidence_score": số thực độ tin cậy từ 0.0 đến 1.0 (vd: 0.95),\n'
            '  "suggested_title": "Tiêu đề bán xe chuyên nghiệp, chuẩn SEO tiếng Việt (vd: Bán xe Toyota Vios 1.5G 2022 màu trắng số tự động)",\n'
            '  "suggested_description": "Mô tả hấp dẫn về kiểu dáng, tình trạng và ưu thế của xe (2-3 câu tiếng Việt)",\n'
            '  "notes": "Ghi chú ngắn về đặc điểm nhận dạng nổi bật từ hình ảnh (vd: Nhận diện lưới tản nhiệt và cụm đèn đặc trưng)"\n'
            "}"
        )

        payload = {
            "contents": [
                {
                    "parts": [
                        {"text": prompt},
                        {"inline_data": {"mime_type": mime_type, "data": b64_img}},
                    ]
                }
            ],
            "generationConfig": {
                "responseMimeType": "application/json",
            },
        }

        data = await self._call_gemini_api(payload, timeout=25.0)
        if data:
            try:
                text = data["candidates"][0]["content"]["parts"][0]["text"].strip()
                # Clean up if markdown fences still exist
                text = re.sub(r"^```(?:json)?\s*", "", text)
                text = re.sub(r"\s*```$", "", text)
                parsed = json.loads(text)
                return CarRecognitionResponse(**parsed)
            except Exception as e:
                logger.warning("Error parsing Gemini car recognition response: %s", e)

        return CarRecognitionResponse(
            confidence_score=0.0,
            notes="Không thể nhận diện chi tiết từ ảnh này hoặc mô hình AI đang bận. Vui lòng kiểm tra lại góc chụp hoặc tự nhập thông tin.",
        )


gemini_client = GeminiClient()
