import uuid
from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, EmailStr


class RejectListingRequest(BaseModel):
    reason: str = Field(min_length=3, max_length=500, description="Lý do từ chối tin đăng")


class TakeDownListingRequest(BaseModel):
    reason: str = Field(min_length=3, max_length=500, description="Lý do gỡ tin đăng khỏi thị trường")


class SubmitInspectionRequest(BaseModel):
    inspection_score: int = Field(..., ge=0, le=100, description="Điểm đánh giá thẩm định từ 0 đến 100")
    inspection_inspector_name: str = Field(..., min_length=2, max_length=100, description="Tên chuyên viên kiểm định")
    inspection_report_pdf_url: Optional[str] = Field(None, description="URL biên bản kiểm định PDF")
    inspection_checklist: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Chi tiết 160 điểm kiểm định")


class AdminUpdateListingRequest(BaseModel):
    title: Optional[str] = Field(None, min_length=3, max_length=255)
    price_vnd: Optional[int] = Field(None, gt=0)
    manufacture_year: Optional[int] = None
    odometer_km: Optional[int] = None
    body_type: Optional[str] = None
    fuel_type: Optional[str] = None
    transmission: Optional[str] = None
    color: Optional[str] = None
    interior_color: Optional[str] = None
    province_code: Optional[str] = None
    location_address: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None


class AdminMetricsResponse(BaseModel):
    total_users: int
    total_listings: int
    pending_listings: int
    published_listings: int
    sold_listings: int
    rejected_listings: int = 0
    total_appointments: int
    pending_appointments: int = 0
    confirmed_appointments: int = 0
    completed_appointments: int = 0
    cancelled_appointments: int = 0
    declined_appointments: int = 0
    appointment_status_distribution: List[Dict[str, Any]] = Field(default_factory=list)
    appointment_success_rate: float = 0.0
    total_inventory_value_vnd: int = 0
    total_sold_value_vnd: int = 0
    monthly_trend: List[Dict[str, Any]] = Field(default_factory=list)
    brand_distribution: List[Dict[str, Any]] = Field(default_factory=list)
    price_segments: List[Dict[str, Any]] = Field(default_factory=list)
    body_type_distribution: List[Dict[str, Any]] = Field(default_factory=list)


class VerifyShowroomRequest(BaseModel):
    is_verified: bool
    rejection_reason: Optional[str] = None


class UpdateUserStatusRequest(BaseModel):
    status: str = Field(description="ACTIVE, SUSPENDED, DELETED")
    reason: Optional[str] = None


class BulkUpdateUserStatusRequest(BaseModel):
    user_ids: List[uuid.UUID]
    status: str = Field(description="ACTIVE, SUSPENDED, DELETED")
    reason: Optional[str] = None


class BulkUpdateShowroomStatusRequest(BaseModel):
    showroom_ids: List[uuid.UUID]
    is_active: bool


class BulkVerifyShowroomRequest(BaseModel):
    showroom_ids: List[uuid.UUID]
    is_verified: bool
    rejection_reason: Optional[str] = None


class BulkDeleteShowroomRequest(BaseModel):
    showroom_ids: List[uuid.UUID]


class UpdateUserRoleRequest(BaseModel):
    role: str = Field(description="ADMIN, INSPECTOR, SUPPORT, USER")


class AdminCreateUserRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6, max_length=100)
    display_name: str = Field(min_length=2, max_length=120)
    phone: Optional[str] = Field(None, max_length=20)
    province_code: Optional[str] = None
    province_name: Optional[str] = None
    address: Optional[str] = None
    role: str = Field(default="USER", description="USER, INSPECTOR, SUPPORT, ADMIN")


class AdminUpdateUserRequest(BaseModel):
    display_name: Optional[str] = Field(None, min_length=2, max_length=120)
    phone: Optional[str] = None
    province_code: Optional[str] = None
    province_name: Optional[str] = None
    address: Optional[str] = None
    role: Optional[str] = None
    status: Optional[str] = None
    new_password: Optional[str] = Field(None, min_length=6)


class AdminCreateShowroomRequest(BaseModel):
    owner_user_id: Optional[uuid.UUID] = None
    owner_email: Optional[str] = None
    name: str = Field(min_length=2, max_length=150)
    phone: Optional[str] = None
    address: Optional[str] = None
    province_code: Optional[str] = None
    description: Optional[str] = None
    logo_url: Optional[str] = None
    banner_url: Optional[str] = None
    is_verified: bool = False
    is_active: bool = True


class AdminUpdateShowroomRequest(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=150)
    phone: Optional[str] = None
    address: Optional[str] = None
    province_code: Optional[str] = None
    description: Optional[str] = None
    logo_url: Optional[str] = None
    banner_url: Optional[str] = None
    is_verified: Optional[bool] = None
    is_active: Optional[bool] = None
    rejection_reason: Optional[str] = None


class AdminListingItemResponse(BaseModel):
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
    primary_image_url: Optional[str] = None
    images_count: int = 0
    seller_id: uuid.UUID
    seller_name: str
    seller_email: Optional[str] = None
    seller_phone: Optional[str] = None
    has_pending_revision: bool = False
    review_status: Optional[str] = None
    revision_no: int = 1
    published_at: Optional[datetime] = None
    created_at: datetime
    rejection_reason: Optional[str] = None


class AdminListingDetailResponse(BaseModel):
    id: uuid.UUID
    status: str
    title: str
    price_vnd: int
    manufacture_year: int
    odometer_km: Optional[int] = None
    condition: Optional[str] = None
    origin: Optional[str] = None
    body_type: str
    fuel_type: str
    transmission: str
    drivetrain: Optional[str] = None
    engine_displacement: Optional[str] = None
    seats: Optional[int] = None
    doors: Optional[int] = None
    color: Optional[str] = None
    interior_color: Optional[str] = None
    province_code: str
    location_address: Optional[str] = None
    description: Optional[str] = None
    brand_id: Optional[uuid.UUID] = None
    brand_name: Optional[str] = None
    model_id: Optional[uuid.UUID] = None
    model_name: Optional[str] = None
    variant_id: Optional[uuid.UUID] = None
    vin: Optional[str] = None
    license_plate: Optional[str] = None
    accident_status: Optional[str] = "UNKNOWN"
    flood_status: Optional[str] = "UNKNOWN"
    service_history: Optional[str] = "UNKNOWN"
    owner_count: Optional[int] = None
    repainted_parts_count: Optional[int] = None
    replaced_parts: Optional[str] = None
    engine_repaired: bool = False
    transmission_repaired: bool = False
    images: List[str] = []
    media: List[Dict[str, Any]] = []
    revision_no: int = 1
    review_status: str = "APPROVED"
    has_pending_revision: bool = False
    published_revision: Optional[Dict[str, Any]] = None
    seller_id: Optional[uuid.UUID] = None
    seller_name: Optional[str] = None
    seller_email: Optional[str] = None
    seller_phone: Optional[str] = None
    seller: Dict[str, Any] = Field(default_factory=dict)
    created_at: datetime
    published_at: Optional[datetime] = None
    rejection_reason: Optional[str] = None
    inspection_score: Optional[int] = None
    inspection_inspector_name: Optional[str] = None
    inspection_report_pdf_url: Optional[str] = None
    inspection_checklist: Optional[Dict[str, Any]] = None
    events: List[Dict[str, Any]] = []


class AdminAppointmentParticipant(BaseModel):
    id: uuid.UUID
    display_name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    avatar_url: Optional[str] = None


class AdminAppointmentListingBrief(BaseModel):
    id: uuid.UUID
    title: str
    price_vnd: int
    primary_image_url: Optional[str] = None


class AdminAppointmentItemResponse(BaseModel):
    id: uuid.UUID
    listing_id: uuid.UUID
    listing: AdminAppointmentListingBrief
    buyer: AdminAppointmentParticipant
    seller: AdminAppointmentParticipant
    scheduled_at: datetime
    location: Optional[str] = None
    note: Optional[str] = None
    status: str
    cancel_reason_code: Optional[str] = None
    cancel_reason_text: Optional[str] = None
    cancelled_by_user_id: Optional[uuid.UUID] = None
    cancelled_by_name: Optional[str] = None
    completed_at: Optional[datetime] = None
    created_at: datetime
    events: List[Dict[str, Any]] = Field(default_factory=list)


class AdminCancelAppointmentRequest(BaseModel):
    reason: str = Field(min_length=3, max_length=500, description="Lý do quản trị viên hủy lịch hẹn")


# ==============================================================
# FEATURED LISTINGS & PROMOTION PACKAGES SCHEMAS
# ==============================================================

class AdminPromotionPackageResponse(BaseModel):
    id: uuid.UUID
    code: str
    name: str
    days: int
    amount_vnd: int
    original_amount_vnd: Optional[int] = None
    discount_percent: Optional[int] = None
    description: Optional[str] = None
    badge: Optional[str] = None
    is_active: bool
    sort_order: int
    created_at: datetime
    updated_at: datetime


class AdminCreatePromotionPackageRequest(BaseModel):
    code: str = Field(min_length=2, max_length=32)
    name: str = Field(min_length=2, max_length=100)
    days: int = Field(gt=0)
    amount_vnd: int = Field(ge=0)
    original_amount_vnd: Optional[int] = None
    description: Optional[str] = None
    badge: Optional[str] = None
    is_active: bool = True
    sort_order: int = 0


class AdminUpdatePromotionPackageRequest(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    days: Optional[int] = Field(None, gt=0)
    amount_vnd: Optional[int] = Field(None, ge=0)
    original_amount_vnd: Optional[int] = None
    description: Optional[str] = None
    badge: Optional[str] = None
    is_active: Optional[bool] = None
    sort_order: Optional[int] = None


class AdminFeaturedListingItemResponse(BaseModel):
    id: uuid.UUID
    title: str
    price_vnd: int
    primary_image_url: Optional[str] = None
    seller_id: uuid.UUID
    seller_name: str
    seller_phone: Optional[str] = None
    seller_email: Optional[str] = None
    seller_avatar: Optional[str] = None
    province_name: Optional[str] = None
    featured_tier: Optional[str] = None
    is_featured: bool
    featured_until: Optional[datetime] = None
    is_active_featured: bool
    hours_remaining: int
    days_remaining: int
    views_count: int
    favorites_count: int
    created_at: datetime


class AdminGrantFeaturedRequest(BaseModel):
    days: int = Field(..., gt=0, le=365, description="Số ngày cấp quyền nổi bật")
    package_code: Optional[str] = Field(None, description="Mã gói nổi bật tương ứng")
    featured_tier: Optional[str] = Field(None, description="Hạng tin nổi bật nếu có")
    note: Optional[str] = Field(None, max_length=255, description="Ghi chú nội bộ hoặc lý do cấp nổi bật")


class AdminRevokeFeaturedRequest(BaseModel):
    reason: Optional[str] = Field(None, max_length=255, description="Lý do thu hồi quyền tin nổi bật")


class AdminPaymentTransactionItemResponse(BaseModel):
    id: uuid.UUID
    order_code: str
    user_id: uuid.UUID
    user_name: str
    user_email: str
    listing_id: uuid.UUID
    listing_title: str
    package_code: str
    package_days: int
    amount_vnd: int
    provider: str
    status: str
    vnp_transaction_no: Optional[str] = None
    vnp_bank_code: Optional[str] = None
    created_at: datetime
    paid_at: Optional[datetime] = None


class AdminPromotionsOverviewResponse(BaseModel):
    total_revenue_vnd: int
    total_transactions: int
    success_transactions: int
    active_featured_count: int
    active_packages_count: int
