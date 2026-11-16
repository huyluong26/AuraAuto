import uuid
from datetime import datetime
from typing import Optional, List, Literal, Dict, Any
from pydantic import BaseModel, Field, ConfigDict, field_validator


class ListingMediaCreate(BaseModel):
    url: str
    thumbnail_url: Optional[str] = None
    media_type: str = "IMAGE"
    is_primary: bool = False
    sort_order: int = 0
    label: Optional[str] = None


class ListingMediaResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    url: str
    thumbnail_url: Optional[str] = None
    media_type: str
    is_primary: bool
    sort_order: int
    label: Optional[str] = None


class CreateListingRequest(BaseModel):
    brand_id: uuid.UUID
    model_id: uuid.UUID
    variant_id: Optional[uuid.UUID] = None
    showroom_id: Optional[uuid.UUID] = None
    seller_type: Optional[str] = "INDIVIDUAL"  # INDIVIDUAL, SHOWROOM
    custom_showroom_name: Optional[str] = None
    custom_showroom_phone: Optional[str] = None

    title: str = Field(min_length=5, max_length=200)
    price_vnd: int = Field(gt=0, description="Giá bán tính theo VNĐ")
    manufacture_year: int = Field(ge=1990, le=2027)
    odometer_km: Optional[int] = Field(None, ge=0)
    mileage_unknown: bool = False
    condition: str = Field(default="USED")  # USED, NEW
    body_type: str = Field(description="SEDAN, SUV, HATCHBACK, MPV, PICKUP, etc.")
    fuel_type: str = Field(description="GASOLINE, DIESEL, HYBRID, ELECTRIC")
    transmission: str = Field(description="MANUAL, AUTOMATIC")
    origin: Optional[str] = None
    color: Optional[str] = None
    interior_color: Optional[str] = None
    seats: Optional[int] = None
    doors: Optional[int] = None
    province_code: str
    location_address: Optional[str] = None
    vin: Optional[str] = None
    license_plate: Optional[str] = None
    description: Optional[str] = None
    accident_status: Literal["UNKNOWN", "NONE", "MINOR", "MAJOR"] = "UNKNOWN"
    flood_status: Literal["UNKNOWN", "NONE", "SUSPECTED", "CONFIRMED"] = "UNKNOWN"
    service_history: Literal["UNKNOWN", "NONE", "PARTIAL", "FULL"] = "UNKNOWN"
    owner_count: Optional[int] = Field(None, ge=1, le=20)
    repainted_parts_count: Optional[int] = Field(None, ge=0, le=50)
    replaced_parts: Optional[str] = Field(None, max_length=1000)
    engine_repaired: bool = False
    transmission_repaired: bool = False
    media: List[ListingMediaCreate] = []

    @field_validator("accident_status", mode="before")
    @classmethod
    def validate_accident_status(cls, v: Any) -> Any:
        if v is None:
            return "UNKNOWN"
        if not isinstance(v, str):
            return v
        v_upper = v.strip().upper()
        if v_upper in {"UNKNOWN", "NONE", "MINOR", "MAJOR"}:
            return v_upper
        v_lower = v.lower()
        if any(w in v_lower for w in ["chưa từng", "không", "chưa va", "nguyên bản", "zin", "chưa"]):
            return "NONE"
        if any(w in v_lower for w in ["nhẹ", "xước", "quẹt", "sát"]):
            return "MINOR"
        if any(w in v_lower for w in ["nặng", "khung gầm", "tai nạn", "ảnh hưởng"]):
            return "MAJOR"
        return v

    @field_validator("flood_status", mode="before")
    @classmethod
    def validate_flood_status(cls, v: Any) -> Any:
        if v is None:
            return "UNKNOWN"
        if not isinstance(v, str):
            return v
        v_upper = v.strip().upper()
        if v_upper in {"UNKNOWN", "NONE", "SUSPECTED", "CONFIRMED"}:
            return v_upper
        v_lower = v.lower()
        if any(w in v_lower for w in ["không", "cam kết", "chưa từng", "zin", "chưa"]):
            return "NONE"
        if any(w in v_lower for w in ["nghi ngờ", "dấu hiệu"]):
            return "SUSPECTED"
        if any(w in v_lower for w in ["ngập", "thủy kích"]):
            return "CONFIRMED"
        return v

    @field_validator("service_history", mode="before")
    @classmethod
    def validate_service_history(cls, v: Any) -> Any:
        if v is None:
            return "UNKNOWN"
        if not isinstance(v, str):
            return v
        v_upper = v.strip().upper()
        if v_upper in {"UNKNOWN", "NONE", "PARTIAL", "FULL"}:
            return v_upper
        v_lower = v.lower()
        if any(w in v_lower for w in ["đầy đủ", "100%", "hãng"]):
            return "FULL"
        if any(w in v_lower for w in ["một phần", "vài", "sổ theo dõi"]):
            return "PARTIAL"
        if any(w in v_lower for w in ["không có", "mất", "chưa rõ"]):
            return "NONE"
        return v

    @field_validator("owner_count", mode="before")
    @classmethod
    def validate_owner_count(cls, v: Any) -> Optional[int]:
        if v is None or v == "":
            return None
        if isinstance(v, (int, float)):
            v_int = int(v)
            return max(1, min(20, v_int)) if v_int > 0 else None
        if isinstance(v, str):
            import re
            m = re.search(r"\d+", v)
            if m:
                val = int(m.group(0))
                return max(1, min(20, val))
        return None

    @field_validator("repainted_parts_count", mode="before")
    @classmethod
    def validate_repainted_parts_count(cls, v: Any) -> Optional[int]:
        if v is None or v == "":
            return None
        if isinstance(v, (int, float)):
            return max(0, min(50, int(v)))
        if isinstance(v, str):
            import re
            m = re.search(r"\d+", v)
            if m:
                return max(0, min(50, int(m.group(0))))
            if "toàn bộ" in v.lower():
                return 10
        return None

    @field_validator("body_type", mode="before")
    @classmethod
    def validate_body_type(cls, v: Any) -> str:
        if not v or not isinstance(v, str):
            return "SEDAN"
        v_upper = v.strip().upper()
        mapping = {
            "GẦM CAO": "SUV",
            "BÁN TẢI": "PICKUP",
            "ĐA DỤNG": "MPV",
            "MUI TRẦN": "CONVERTIBLE",
        }
        for k, mapped in mapping.items():
            if k in v_upper:
                return mapped
        return v_upper

    @field_validator("fuel_type", mode="before")
    @classmethod
    def validate_fuel_type(cls, v: Any) -> str:
        if not v or not isinstance(v, str):
            return "GASOLINE"
        v_upper = v.strip().upper()
        if "XĂNG" in v_upper or "GAS" in v_upper:
            return "GASOLINE"
        if "DẦU" in v_upper or "DIESEL" in v_upper:
            return "DIESEL"
        if "ĐIỆN" in v_upper or "ELECTRIC" in v_upper:
            return "ELECTRIC"
        if "HYBRID" in v_upper:
            return "HYBRID"
        return v_upper

    @field_validator("transmission", mode="before")
    @classmethod
    def validate_transmission(cls, v: Any) -> str:
        if not v or not isinstance(v, str):
            return "AUTOMATIC"
        v_upper = v.strip().upper()
        if "SÀN" in v_upper or "MANUAL" in v_upper:
            return "MANUAL"
        return "AUTOMATIC"


class UpdateListingRequest(CreateListingRequest):
    """Payload gửi duyệt bản chỉnh sửa tin đăng xe đầy đủ như form đăng."""
    pass


class ListingListItemResponse(BaseModel):
    id: uuid.UUID
    status: str
    title: str
    price_vnd: int
    manufacture_year: int
    odometer_km: Optional[int] = None
    body_type: str
    fuel_type: str
    transmission: str
    province_code: str
    location_address: Optional[str] = None
    province_name: Optional[str] = None
    primary_image_url: Optional[str] = None
    seller_id: uuid.UUID
    seller_name: str
    seller_type: str = "INDIVIDUAL"
    showroom_id: Optional[uuid.UUID] = None
    showroom_name: Optional[str] = None
    is_showroom_verified: bool = False
    is_featured: bool = False
    featured_until: Optional[datetime] = None
    featured_tier: Optional[str] = None
    views_count: int = 0
    favorites_count: int = 0
    contacts_count: int = 0
    rejection_reason: Optional[str] = None
    has_pending_revision: bool = False
    pending_revision_no: Optional[int] = None
    review_status: Optional[str] = None
    published_at: Optional[datetime] = None
    created_at: datetime


class MyListingsSummaryResponse(BaseModel):
    total_listings: int
    published_listings: int
    pending_listings: int
    sold_listings: int
    rejected_listings: int
    draft_listings: int
    hidden_listings: int
    featured_listings: int
    total_views: int
    total_favorites: int


class QuickUpdateListingRequest(BaseModel):
    price_vnd: Optional[int] = Field(None, gt=0)
    title: Optional[str] = Field(None, min_length=5, max_length=200)
    location_address: Optional[str] = None


class SellerBrief(BaseModel):
    id: uuid.UUID
    display_name: str
    phone: Optional[str] = None
    avatar_url: Optional[str] = None
    showroom_name: Optional[str] = None
    is_showroom_verified: bool = False


class ListingDetailResponse(BaseModel):
    id: uuid.UUID
    status: str
    version: int
    published_at: Optional[datetime] = None
    views_count: int
    favorites_count: int
    is_featured: bool = False
    featured_until: Optional[datetime] = None
    featured_tier: Optional[str] = None

    # Revision attributes
    revision_id: uuid.UUID
    brand_id: Optional[uuid.UUID] = None
    brand_name: Optional[str] = None
    title: str
    price_vnd: int
    manufacture_year: int
    odometer_km: Optional[int] = None
    body_type: str
    fuel_type: str
    transmission: str
    origin: Optional[str] = None
    color: Optional[str] = None
    interior_color: Optional[str] = None
    seats: Optional[int] = None
    doors: Optional[int] = None
    province_code: str
    location_address: Optional[str] = None
    vin: Optional[str] = None
    license_plate: Optional[str] = None
    revision_no: int = 1
    review_status: str = "APPROVED"
    has_pending_revision: bool = False
    description: Optional[str] = None
    accident_status: str
    flood_status: str
    service_history: str
    owner_count: Optional[int] = None
    repainted_parts_count: Optional[int] = None
    replaced_parts: Optional[str] = None
    engine_repaired: bool
    transmission_repaired: bool

    # 160-point Inspection
    inspection_report_pdf_url: Optional[str] = None
    inspection_score: Optional[int] = None
    inspection_inspector_name: Optional[str] = None
    inspection_checklist: Optional[Dict[str, Any]] = None

    media: List[ListingMediaResponse] = []

    # Seller
    seller: SellerBrief
    seller_type: str = "INDIVIDUAL"
    showroom_id: Optional[uuid.UUID] = None
    showroom_name: Optional[str] = None
    is_showroom_verified: bool = False


class ListingFilterParams(BaseModel):
    brand_id: Optional[uuid.UUID] = None
    model_id: Optional[uuid.UUID] = None
    min_price_vnd: Optional[int] = None
    max_price_vnd: Optional[int] = None
    min_year: Optional[int] = None
    max_year: Optional[int] = None
    max_km: Optional[int] = None
    body_type: Optional[str] = None
    fuel_type: Optional[str] = None
    transmission: Optional[str] = None
    province_code: Optional[str] = None
    search: Optional[str] = None
    is_featured: Optional[bool] = None
    sort_by: Optional[str] = "newest"  # newest, price_asc, price_desc, year_desc, km_asc
