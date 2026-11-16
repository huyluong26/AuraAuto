from typing import Optional, List
from datetime import datetime
import uuid
from pydantic import BaseModel, Field


class PromotionPackageInfo(BaseModel):
    code: str
    name: str
    days: int
    amount_vnd: int
    original_amount_vnd: Optional[int] = None
    discount_percent: Optional[int] = None
    description: str
    badge: Optional[str] = None
    color: Optional[str] = "blue"
    is_active: Optional[bool] = True
    sort_order: Optional[int] = 0


class CreatePromotionRequest(BaseModel):
    listing_id: uuid.UUID
    package_code: str
    bank_code: Optional[str] = None


class CreatePromotionResponse(BaseModel):
    order_code: str
    payment_url: str
    amount_vnd: int
    package_name: str
    days: int


class PaymentTransactionResponse(BaseModel):
    id: uuid.UUID
    order_code: str
    listing_id: uuid.UUID
    package_code: str
    package_days: int
    amount_vnd: int
    status: str
    created_at: datetime
    paid_at: Optional[datetime] = None
    vnp_transaction_no: Optional[str] = None
    vnp_bank_code: Optional[str] = None


class ListingPromotionStatusResponse(BaseModel):
    listing_id: uuid.UUID
    is_featured: bool
    featured_until: Optional[datetime] = None
    featured_tier: Optional[str] = None
    active_days_remaining: int = 0
