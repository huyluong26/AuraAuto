import uuid
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field
from app.modules.listings.schemas import ListingListItemResponse


class ValuationBreakdownItem(BaseModel):
    category: str = Field(description="ACCIDENT, FLOOD, ENGINE, TRANSMISSION, SERVICE, OWNERSHIP, LUXURY_TRIM")
    label: str = Field(description="Tên hạng mục kiểm định")
    impact: str = Field(description="GIẢM, TĂNG, hoặc NGUYÊN BẢN")
    percentage: float = Field(description="Tỷ lệ % điều chỉnh so với giá gốc")
    amount_vnd: int = Field(description="Số tiền điều chỉnh (VNĐ)")
    note: str = Field(description="Mô tả lý do chiết khấu hoặc cộng thưởng")


class ValuationRequest(BaseModel):
    brand: str = Field(description="Tên hãng xe (vd: Toyota, Mazda)")
    model: str = Field(description="Tên dòng xe (vd: Vios, CX-5)")
    variant: Optional[str] = None
    manufacture_year: int = Field(ge=1990, le=2027)
    odometer_km: int = Field(ge=0)
    body_type: Optional[str] = None
    fuel_type: Optional[str] = None
    transmission: Optional[str] = None
    province_code: Optional[str] = None
    engine_displacement: Optional[float] = None
    seats: Optional[int] = None
    doors: Optional[int] = None
    origin: Optional[str] = None
    is_imported: Optional[int] = None
    condition: Optional[str] = None  # NEW, USED
    # Các trường kiểm định lịch sử & tình trạng thực tế của xe
    accident_status: Optional[str] = None  # NONE, MINOR, MODERATE, MAJOR, UNKNOWN
    flood_status: Optional[str] = None  # NONE, MINOR, SUBMERGED, UNKNOWN
    service_history: Optional[str] = None  # FULL_DEALER, REGULAR_GARAGE, IRREGULAR, UNKNOWN
    engine_repaired: Optional[bool] = None  # Đã từng đại tu/rã máy
    transmission_repaired: Optional[bool] = None  # Đã từng đại tu hộp số
    owner_count: Optional[int] = None  # Số đời chủ
    repainted_parts_count: Optional[int] = None  # Số chi tiết sơn lại
    replaced_parts: Optional[str] = None


class GeminiExplanation(BaseModel):
    summary: str
    positive_factors: List[str] = []
    negative_factors: List[str] = []
    market_advice: Optional[str] = None


class MarketSource(BaseModel):
    title: str
    url: str


class GeminiMarketValuation(BaseModel):
    median_price_vnd: int
    low_price_vnd: int
    high_price_vnd: int
    comparable_count: int
    confidence: str
    summary: str
    sources: List[MarketSource] = []


class ValuationResponse(BaseModel):
    status: str = "PREDICTED"  # PREDICTED, OUT_OF_SUPPORT, ERROR
    model_version: str = "CatBoost-v4.0-Appraisal"
    estimated_price_vnd: Optional[int] = None
    base_price_vnd: Optional[int] = None
    condition_multiplier: Optional[float] = 1.0
    total_condition_adjustment_vnd: Optional[int] = 0
    breakdown_items: List[ValuationBreakdownItem] = []
    interval_low_vnd: Optional[int] = None
    interval_high_vnd: Optional[int] = None
    interval_method: str = "CONFORMAL_RESIDUAL_CALIBRATION"
    confidence_level: Optional[str] = None
    reference_count: Optional[int] = None
    ml_price_vnd: Optional[int] = None
    gemini_market_price_vnd: Optional[int] = None
    pricing_method: str = "ML_ONLY"
    market_sources: List[MarketSource] = []
    reason: Optional[str] = None
    similar_listings: List[ListingListItemResponse] = []
    explanation: Optional[GeminiExplanation] = None
    disclaimer: str = "Giá ước tính mang tính tham khảo từ dữ liệu thị trường; không phải cam kết giá giao dịch."


class NaturalSearchRequest(BaseModel):
    query: str = Field(min_length=2, max_length=500, description="Câu tìm kiếm tiếng Việt (vd: tìm xe SUV dưới 700 triệu đời từ 2021)")


class ExtractedCriteria(BaseModel):
    brand: Optional[str] = None
    model: Optional[str] = None
    body_type: Optional[str] = None
    fuel_type: Optional[str] = None
    transmission: Optional[str] = None
    min_price_vnd: Optional[int] = None
    max_price_vnd: Optional[int] = None
    min_year: Optional[int] = None
    max_year: Optional[int] = None
    max_km: Optional[int] = None
    province_code: Optional[str] = None


class NaturalSearchResponse(BaseModel):
    original_query: str
    extracted_criteria: ExtractedCriteria
    results: List[ListingListItemResponse]
    total_found: int


class RecommendationRequest(BaseModel):
    max_budget_vnd: Optional[int] = None
    preferred_body_types: Optional[List[str]] = None
    preferred_brands: Optional[List[str]] = None
    limit: int = Field(default=6, ge=1, le=20)


class CarRecognitionResponse(BaseModel):
    brand: Optional[str] = None
    model: Optional[str] = None
    trim: Optional[str] = None
    manufacture_year: Optional[int] = None
    body_type: Optional[str] = None
    color: Optional[str] = None
    fuel_type: Optional[str] = None
    transmission: Optional[str] = None
    seats: Optional[int] = None
    odometer_km: Optional[int] = None
    confidence_score: float = 0.0
    suggested_title: Optional[str] = None
    suggested_description: Optional[str] = None
    image_url: Optional[str] = None
    notes: Optional[str] = None


class CarRecognitionFromUrlRequest(BaseModel):
    image_url: Optional[str] = None
    image_base64: Optional[str] = None





