import uuid
from datetime import datetime, timezone
from typing import List, Optional
from sqlalchemy import select, func, desc, or_
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.cache import fast_cache
from app.modules.chats.ws_manager import ws_manager
from app.models.user import User
from app.models.listing import Listing, ListingRevision
from app.models.appointment import Appointment, AppointmentEvent
from app.models.notification import Notification
from app.modules.admin.schemas import (
    AdminAppointmentItemResponse,
    AdminAppointmentParticipant,
    AdminAppointmentListingBrief,
    AdminCancelAppointmentRequest,
)
from app.shared.exceptions import NotFoundException, ConflictException, ForbiddenException
from app.shared.schemas import SuccessResponse



class AdminAppointmentsMixin:
    db: AsyncSession

    # ==========================================
    # 6. APPOINTMENTS MANAGEMENT
    # ==========================================
    async def list_appointments(
        self,
        status_filter: Optional[str] = None,
        search: Optional[str] = None,
        page: int = 1,
        page_size: int = 50,
    ) -> List[AdminAppointmentItemResponse]:
        db = self.db
        stmt = (
            select(Appointment)
            .options(
                selectinload(Appointment.buyer),
                selectinload(Appointment.seller),
                selectinload(Appointment.listing).selectinload(Listing.published_revision).selectinload(ListingRevision.media),
            )
            .order_by(Appointment.created_at.desc(), Appointment.scheduled_at.desc())
        )

        if status_filter:
            stmt = stmt.where(Appointment.status == status_filter.upper())

        offset = (page - 1) * page_size
        stmt = stmt.offset(offset).limit(page_size)

        res = await db.execute(stmt)
        appts = res.scalars().all()

        results = []
        for a in appts:
            car_title = "Xe đã đăng"
            car_price = 0
            car_img = None
            if a.listing and a.listing.published_revision:
                rev = a.listing.published_revision
                car_title = rev.title
                car_price = rev.price_vnd
                if rev.media:
                    car_img = rev.media[0].url

            results.append(
                AdminAppointmentItemResponse(
                    id=a.id,
                    listing_id=a.listing_id,
                    scheduled_at=a.scheduled_at,
                    location=a.location,
                    status=a.status,
                    note=a.note,
                    cancel_reason_code=a.cancel_reason_code,
                    cancel_reason_text=a.cancel_reason_text,
                    cancelled_by_user_id=a.cancelled_by_user_id,
                    completed_at=a.completed_at,
                    created_at=a.created_at,
                    buyer=AdminAppointmentParticipant(
                        id=a.buyer.id,
                        display_name=a.buyer.display_name,
                        phone=a.buyer.phone,
                        email=a.buyer.email,
                        avatar_url=a.buyer.avatar_url,
                    ),
                    seller=AdminAppointmentParticipant(
                        id=a.seller.id,
                        display_name=a.seller.display_name,
                        phone=a.seller.phone,
                        email=a.seller.email,
                        avatar_url=a.seller.avatar_url,
                    ),
                    listing=AdminAppointmentListingBrief(
                        id=a.listing_id,
                        title=car_title,
                        price_vnd=car_price,
                        primary_image_url=car_img,
                    ),
                )
            )
        return results

    async def get_appointments_tab_counts(self) -> dict:
        stmt = select(Appointment.status, func.count(Appointment.id)).group_by(Appointment.status)
        res = await self.db.execute(stmt)
        counts = {row[0]: int(row[1]) for row in res.all()}
        total = sum(counts.values())
        return {
            "ALL": total,
            "PENDING": counts.get("PENDING", 0),
            "CONFIRMED": counts.get("CONFIRMED", 0),
            "COMPLETED": counts.get("COMPLETED", 0),
            "CANCELLED": counts.get("CANCELLED", 0),
        }

    async def get_appointment_detail(self, id: uuid.UUID) -> AdminAppointmentItemResponse:
        db = self.db
        stmt = (
            select(Appointment)
            .options(
                selectinload(Appointment.buyer),
                selectinload(Appointment.seller),
                selectinload(Appointment.listing).selectinload(Listing.published_revision).selectinload(ListingRevision.media),
            )
            .where(Appointment.id == id)
        )
        res = await db.execute(stmt)
        a = res.scalar_one_or_none()
        if not a:
            raise NotFoundException("Lịch hẹn không tồn tại")

        car_title = "Xe đã đăng"
        car_price = 0
        car_img = None
        if a.listing and a.listing.published_revision:
            rev = a.listing.published_revision
            car_title = rev.title
            car_price = rev.price_vnd
            if rev.media:
                car_img = rev.media[0].url

        return AdminAppointmentItemResponse(
            id=a.id,
            listing_id=a.listing_id,
            scheduled_at=a.scheduled_at,
            location=a.location,
            status=a.status,
            note=a.note,
            cancel_reason_code=a.cancel_reason_code,
            cancel_reason_text=a.cancel_reason_text,
            cancelled_by_user_id=a.cancelled_by_user_id,
            completed_at=a.completed_at,
            created_at=a.created_at,
            buyer=AdminAppointmentParticipant(
                id=a.buyer.id,
                display_name=a.buyer.display_name,
                phone=a.buyer.phone,
                email=a.buyer.email,
                avatar_url=a.buyer.avatar_url,
            ),
            seller=AdminAppointmentParticipant(
                id=a.seller.id,
                display_name=a.seller.display_name,
                phone=a.seller.phone,
                email=a.seller.email,
                avatar_url=a.seller.avatar_url,
            ),
            listing=AdminAppointmentListingBrief(
                id=a.listing_id,
                title=car_title,
                price_vnd=car_price,
                primary_image_url=car_img,
            ),
        )

    async def cancel_appointment(self, id: uuid.UUID, data: AdminCancelAppointmentRequest, admin_user: User) -> SuccessResponse:
        db = self.db
        stmt = (
            select(Appointment)
            .options(selectinload(Appointment.buyer), selectinload(Appointment.seller), selectinload(Appointment.listing).selectinload(Listing.published_revision))
            .where(Appointment.id == id)
        )
        res = await db.execute(stmt)
        a = res.scalar_one_or_none()
        if not a:
            raise NotFoundException("Lịch hẹn không tồn tại")

        old_status = a.status
        a.status = "CANCELLED"
        a.cancel_reason_code = "ADMIN_CANCELLED"
        a.cancel_reason_text = f"[Admin hủy] {data.reason}"
        a.cancelled_by_user_id = admin_user.id

        event = AppointmentEvent(
            id=uuid.uuid4(),
            appointment_id=a.id,
            from_status=old_status,
            to_status="CANCELLED",
            note=f"Hủy bởi Quản trị viên: {data.reason}",
            actor_user_id=admin_user.id,
        )
        db.add(event)

        car_name = a.listing.published_revision.title if (a.listing and a.listing.published_revision) else "Xe"
        for uid in [a.buyer_user_id, a.seller_user_id]:
            noti = Notification(
                id=uuid.uuid4(),
                user_id=uid,
                title="Lịch hẹn xem xe đã bị hủy bởi Quản trị viên",
                body=f"Lịch hẹn xem xe '{car_name}' vào {a.scheduled_at.strftime('%H:%M %d/%m/%Y')} đã bị hủy. Lý do: {data.reason}",
                type="SYSTEM",
                reference_type="appointment",
                reference_id=a.id,
            )
            db.add(noti)

        await db.commit()
        return SuccessResponse(
            message="Đã hủy lịch hẹn và gửi thông báo tới người mua & người bán thành công",
            data={"id": str(a.id), "status": a.status},
        )

