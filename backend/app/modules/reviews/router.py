import uuid
from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_active_user
from app.models.user import User
from app.models.appointment import Appointment
from app.models.review import Review
from app.modules.reviews.schemas import (
    CreateReviewRequest,
    ReviewResponse,
    SellerReviewsSummary,
)
from app.shared.exceptions import NotFoundException, ForbiddenException, ConflictException
from app.shared.schemas import SuccessResponse

router = APIRouter(tags=["Reviews"])


@router.post("/reviews", response_model=SuccessResponse, status_code=status.HTTP_201_CREATED)
async def create_review(
    data: CreateReviewRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    stmt = (
        select(Appointment)
        .options(selectinload(Appointment.review))
        .where(Appointment.id == data.appointment_id)
    )
    res = await db.execute(stmt)
    appt = res.scalar_one_or_none()

    if not appt:
        raise NotFoundException("Lịch hẹn xem xe không tồn tại")
    if appt.buyer_user_id != current_user.id:
        raise ForbiddenException("Chỉ người mua trong lịch hẹn mới được để lại đánh giá")
    if appt.status != "COMPLETED":
        raise ConflictException("Chỉ có thể đánh giá sau khi buổi xem xe đã diễn ra hoàn thành (COMPLETED)")
    if appt.review:
        raise ConflictException("Bạn đã gửi đánh giá cho lịch xem xe này rồi")

    review = Review(
        appointment_id=appt.id,
        reviewer_user_id=current_user.id,
        seller_user_id=appt.seller_user_id,
        rating=data.rating,
        comment=data.comment,
        status="VISIBLE",
    )
    db.add(review)
    await db.commit()
    await db.refresh(review)

    return SuccessResponse(
        message="Gửi đánh giá thành công! Cảm ơn phản hồi của bạn.",
        data={"review_id": str(review.id)},
    )


@router.get("/sellers/{seller_id}/reviews", response_model=SellerReviewsSummary)
async def get_seller_reviews(
    seller_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    stmt = (
        select(Review)
        .options(selectinload(Review.reviewer))
        .where(
            Review.seller_user_id == seller_id,
            Review.status == "VISIBLE",
        )
        .order_by(Review.created_at.desc())
    )
    res = await db.execute(stmt)
    reviews = res.scalars().all()

    total = len(reviews)
    avg = sum(r.rating for r in reviews) / total if total > 0 else 0.0

    items = [
        ReviewResponse(
            id=r.id,
            rating=r.rating,
            comment=r.comment,
            reviewer_name=r.reviewer.display_name,
            created_at=r.created_at,
        )
        for r in reviews
    ]

    return SellerReviewsSummary(
        seller_id=seller_id,
        average_rating=round(avg, 1),
        total_reviews=total,
        reviews=items,
    )
