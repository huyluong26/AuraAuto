import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy import select, or_
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_active_user
from app.models.user import User
from app.models.appointment import Appointment
from app.models.listing import Listing, ListingRevision
from app.modules.appointments.schemas import (
    CreateAppointmentRequest,
    CancelAppointmentRequest,
    AppointmentResponse,
    AppointmentParticipant,
    AppointmentListingBrief,
)
from app.modules.appointments.service import AppointmentService
from app.shared.schemas import SuccessResponse

router = APIRouter(prefix="/appointments", tags=["Appointments"])


def _to_response(appt: Appointment) -> AppointmentResponse:
    rev = appt.listing.published_revision or (appt.listing.revisions[0] if appt.listing.revisions else None)
    return AppointmentResponse(
        id=appt.id,
        listing_id=appt.listing_id,
        scheduled_at=appt.scheduled_at,
        location=appt.location,
        note=appt.note,
        status=appt.status,
        cancel_reason_code=appt.cancel_reason_code,
        cancel_reason_text=appt.cancel_reason_text,
        completed_at=appt.completed_at,
        created_at=appt.created_at,
        has_reviewed=appt.review is not None,
        listing=AppointmentListingBrief(
            id=appt.listing.id,
            title=rev.title if rev else "Xe ô tô",
            price_vnd=rev.price_vnd if rev else 0,
        ),
        buyer=AppointmentParticipant(
            id=appt.buyer.id,
            display_name=appt.buyer.display_name,
            phone=appt.buyer.phone,
            avatar_url=appt.buyer.avatar_url,
        ),
        seller=AppointmentParticipant(
            id=appt.seller.id,
            display_name=appt.seller.display_name,
            phone=appt.seller.phone,
            avatar_url=appt.seller.avatar_url,
        ),
    )


@router.post("", response_model=SuccessResponse, status_code=status.HTTP_201_CREATED)
async def create_appointment(
    data: CreateAppointmentRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    service = AppointmentService(db)
    appt = await service.create_appointment(current_user, data)
    return SuccessResponse(
        message="Gửi yêu cầu đặt lịch xem xe thành công!",
        data={"id": str(appt.id), "status": appt.status},
    )


@router.get("", response_model=List[AppointmentResponse])
async def list_appointments(
    role: str = Query("all", description="all, buyer, seller"),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    stmt = (
        select(Appointment)
        .options(
            selectinload(Appointment.buyer),
            selectinload(Appointment.seller),
            selectinload(Appointment.review),
            selectinload(Appointment.listing).selectinload(Listing.published_revision),
            selectinload(Appointment.listing).selectinload(Listing.revisions),
        )
        .order_by(Appointment.scheduled_at.desc())
    )

    if role == "buyer":
        stmt = stmt.where(Appointment.buyer_user_id == current_user.id)
    elif role == "seller":
        stmt = stmt.where(Appointment.seller_user_id == current_user.id)
    else:
        stmt = stmt.where(
            or_(
                Appointment.buyer_user_id == current_user.id,
                Appointment.seller_user_id == current_user.id,
            )
        )

    res = await db.execute(stmt)
    appts = res.scalars().all()
    return [_to_response(a) for a in appts]


@router.post("/{id}/confirm", response_model=SuccessResponse)
async def confirm_appointment(
    id: uuid.UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    service = AppointmentService(db)
    appt = await service.confirm_appointment(id, current_user)
    return SuccessResponse(message="Xác nhận lịch xem xe thành công!", data={"status": appt.status})


@router.post("/{id}/decline", response_model=SuccessResponse)
async def decline_appointment(
    id: uuid.UUID,
    reason: Optional[str] = None,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    service = AppointmentService(db)
    appt = await service.decline_appointment(id, current_user, reason)
    return SuccessResponse(message="Từ chối lịch xem xe thành công!", data={"status": appt.status})


@router.post("/{id}/cancel", response_model=SuccessResponse)
async def cancel_appointment(
    id: uuid.UUID,
    data: Optional[CancelAppointmentRequest] = None,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    service = AppointmentService(db)
    req_data = data or CancelAppointmentRequest(cancel_reason_code="OTHER", cancel_reason_text="Hủy lịch hẹn")
    appt = await service.cancel_appointment(id, current_user, req_data)
    return SuccessResponse(message="Hủy lịch xem xe thành công!", data={"status": appt.status})


@router.post("/{id}/complete", response_model=SuccessResponse)
async def complete_appointment(
    id: uuid.UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    service = AppointmentService(db)
    appt = await service.complete_appointment(id, current_user)
    return SuccessResponse(message="Đã xác nhận hoàn thành buổi xem xe!", data={"status": appt.status})
