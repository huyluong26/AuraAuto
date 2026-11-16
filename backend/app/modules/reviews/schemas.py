import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class CreateReviewRequest(BaseModel):
    appointment_id: uuid.UUID
    rating: int = Field(ge=1, le=5, description="Số sao từ 1 đến 5")
    comment: Optional[str] = Field(None, max_length=1000)


class ReviewResponse(BaseModel):
    id: uuid.UUID
    rating: int
    comment: Optional[str] = None
    reviewer_name: str
    created_at: datetime


class SellerReviewsSummary(BaseModel):
    seller_id: uuid.UUID
    average_rating: float
    total_reviews: int
    reviews: list[ReviewResponse]
