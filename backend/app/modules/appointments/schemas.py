import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, model_validator


class CreateAppointmentRequest(BaseModel):
    listing_id: uuid.UUID
    scheduled_at: datetime
    location: Optional[str] = None
    note: Optional[str] = None


class CancelAppointmentRequest(BaseModel):
    cancel_reason_code: Optional[str] = Field(default=None, description="BUYER_BUSY, SELLER_BUSY, CAR_SOLD, OTHER")
    cancel_reason_text: Optional[str] = None
    reason_code: Optional[str] = None
    reason_text: Optional[str] = None

    @model_validator(mode="after")
    def resolve_fields(self):
        if not self.cancel_reason_code and self.reason_code:
            self.cancel_reason_code = self.reason_code
        if not self.cancel_reason_text and self.reason_text:
            self.cancel_reason_text = self.reason_text
        if not self.cancel_reason_code:
            self.cancel_reason_code = "OTHER"
        return self


class AppointmentParticipant(BaseModel):
    id: uuid.UUID
    display_name: str
    phone: Optional[str] = None
    avatar_url: Optional[str] = None


class AppointmentListingBrief(BaseModel):
    id: uuid.UUID
    title: str
    price_vnd: int
    status: Optional[str] = None


class AppointmentResponse(BaseModel):
    id: uuid.UUID
    listing_id: uuid.UUID
    scheduled_at: datetime
    location: Optional[str] = None
    note: Optional[str] = None
    status: str
    cancel_reason_code: Optional[str] = None
    cancel_reason_text: Optional[str] = None
    completed_at: Optional[datetime] = None
    created_at: datetime
    has_reviewed: bool = False

    listing: AppointmentListingBrief
    buyer: AppointmentParticipant
    seller: AppointmentParticipant
