import uuid
from datetime import datetime, timezone
from typing import List
from sqlalchemy import select, or_
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.appointment import Appointment, AppointmentEvent
from app.models.listing import Listing, ListingRevision, ListingStatusEvent
from app.models.notification import Notification
from app.models.user import User
from app.modules.chats.ws_manager import ws_manager
from app.modules.appointments.schemas import (
    CreateAppointmentRequest,
    CancelAppointmentRequest,
    AppointmentResponse,
    AppointmentParticipant,
    AppointmentListingBrief,
)
from app.shared.exceptions import (
    NotFoundException,
    ForbiddenException,
    ConflictException,
    AppException,
)


class AppointmentService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_appointment(self, buyer: User, data: CreateAppointmentRequest) -> Appointment:
        stmt = (
            select(Listing)
            .options(selectinload(Listing.published_revision))
            .where(Listing.id == data.listing_id)
        )
        res = await self.db.execute(stmt)
        listing = res.scalar_one_or_none()

        if not listing:
            raise NotFoundException("Tin đăng không tồn tại")
        if listing.status != "PUBLISHED":
            raise ConflictException("Chỉ có thể đặt lịch xem các xe đang được đăng bán công khai")
        if listing.seller_user_id == buyer.id:
            raise ConflictException("Bạn không thể tự đặt lịch xem xe của chính mình")
        if data.scheduled_at <= datetime.now(timezone.utc):
            raise AppException(status_code=400, code="INVALID_SCHEDULE_TIME", message="Thời gian hẹn phải ở tương lai")

        # Check existing active appointment
        dup_stmt = select(Appointment).where(
            Appointment.listing_id == data.listing_id,
            Appointment.buyer_user_id == buyer.id,
            Appointment.status.in_(["PENDING", "CONFIRMED"]),
        )
        dup_res = await self.db.execute(dup_stmt)
        if dup_res.scalar_one_or_none():
            raise ConflictException("Bạn đang có một lịch hẹn đang chờ hoặc đã xác nhận cho chiếc xe này")

        appointment = Appointment(
            listing_id=listing.id,
            buyer_user_id=buyer.id,
            seller_user_id=listing.seller_user_id,
            scheduled_at=data.scheduled_at,
            location=data.location,
            note=data.note,
            status="PENDING",
        )
        self.db.add(appointment)
        try:
            await self.db.flush()
        except IntegrityError:
            await self.db.rollback()
            raise ConflictException("Bạn đang có một lịch hẹn đang chờ hoặc đã xác nhận cho chiếc xe này")

        event = AppointmentEvent(
            appointment_id=appointment.id,
            actor_user_id=buyer.id,
            from_status=None,
            to_status="PENDING",
            note="Người mua tạo yêu cầu xem xe",
        )
        self.db.add(event)

        # Notify seller
        noti = Notification(
            user_id=listing.seller_user_id,
            title="Yêu cầu xem xe mới",
            body=f"{buyer.display_name} muốn đặt lịch xem xe của bạn.",
            type="APPOINTMENT",
            reference_type="appointment",
            reference_id=appointment.id,
        )
        self.db.add(noti)

        await self.db.commit()
        await self.db.refresh(appointment)

        # Real-time WebSocket push notification to seller
        await ws_manager.send_notification_to_user(
            listing.seller_user_id,
            {
                "id": str(noti.id),
                "title": noti.title,
                "body": noti.body,
                "type": noti.type,
                "reference_id": str(appointment.id),
            },
        )
        return appointment

    async def confirm_appointment(self, appointment_id: uuid.UUID, user: User) -> Appointment:
        stmt = select(Appointment).where(Appointment.id == appointment_id).with_for_update()
        res = await self.db.execute(stmt)
        appt = res.scalar_one_or_none()

        if not appt:
            raise NotFoundException("Không tìm thấy lịch hẹn")
        if appt.seller_user_id != user.id:
            raise ForbiddenException("Chỉ người bán mới có quyền xác nhận lịch hẹn này")
        if appt.status != "PENDING":
            raise ConflictException(f"Không thể xác nhận lịch hẹn đang ở trạng thái {appt.status}")

        appt.status = "CONFIRMED"
        event = AppointmentEvent(
            appointment_id=appt.id,
            actor_user_id=user.id,
            from_status="PENDING",
            to_status="CONFIRMED",
            note="Người bán đã xác nhận đồng ý lịch xem xe",
        )
        self.db.add(event)

        noti = Notification(
            user_id=appt.buyer_user_id,
            title="Lịch xem xe đã được xác nhận",
            body="Người bán đã đồng ý với lịch hẹn xem xe của bạn.",
            type="APPOINTMENT",
            reference_type="appointment",
            reference_id=appt.id,
        )
        self.db.add(noti)

        await self.db.commit()
        await self.db.refresh(appt)

        # Real-time WebSocket push notification to buyer
        await ws_manager.send_notification_to_user(
            appt.buyer_user_id,
            {
                "id": str(noti.id),
                "title": noti.title,
                "body": noti.body,
                "type": noti.type,
                "reference_id": str(appt.id),
            },
        )
        return appt

    async def decline_appointment(self, appointment_id: uuid.UUID, user: User, reason: str = None) -> Appointment:
        stmt = select(Appointment).where(Appointment.id == appointment_id).with_for_update()
        res = await self.db.execute(stmt)
        appt = res.scalar_one_or_none()

        if not appt:
            raise NotFoundException("Không tìm thấy lịch hẹn")
        if appt.seller_user_id != user.id:
            raise ForbiddenException("Chỉ người bán mới có quyền từ chối lịch hẹn")
        if appt.status != "PENDING":
            raise ConflictException("Lịch hẹn không ở trạng thái chờ xác nhận")

        appt.status = "DECLINED"
        appt.cancel_reason_text = reason
        event = AppointmentEvent(
            appointment_id=appt.id,
            actor_user_id=user.id,
            from_status="PENDING",
            to_status="DECLINED",
            note=f"Người bán từ chối lịch hẹn: {reason or 'Không có lý do'}",
        )
        self.db.add(event)

        noti = Notification(
            user_id=appt.buyer_user_id,
            title="Lịch xem xe bị từ chối",
            body="Người bán đã từ chối lịch xem xe của bạn.",
            type="APPOINTMENT",
            reference_type="appointment",
            reference_id=appt.id,
        )
        self.db.add(noti)

        await self.db.commit()
        await self.db.refresh(appt)

        # Real-time WebSocket push notification to buyer
        await ws_manager.send_notification_to_user(
            appt.buyer_user_id,
            {
                "id": str(noti.id),
                "title": noti.title,
                "body": noti.body,
                "type": noti.type,
                "reference_id": str(appt.id),
            },
        )
        return appt

    async def cancel_appointment(self, appointment_id: uuid.UUID, user: User, data: CancelAppointmentRequest) -> Appointment:
        stmt = select(Appointment).where(Appointment.id == appointment_id).with_for_update()
        res = await self.db.execute(stmt)
        appt = res.scalar_one_or_none()

        if not appt:
            raise NotFoundException("Không tìm thấy lịch hẹn")
        if user.id not in [appt.buyer_user_id, appt.seller_user_id]:
            raise ForbiddenException("Bạn không tham gia vào lịch hẹn này")
        if appt.status not in ["PENDING", "CONFIRMED"]:
            raise ConflictException("Chỉ có thể hủy lịch hẹn đang chờ hoặc đã xác nhận")

        old_status = appt.status
        appt.status = "CANCELLED"
        appt.cancel_reason_code = data.cancel_reason_code
        appt.cancel_reason_text = data.cancel_reason_text
        appt.cancelled_by_user_id = user.id

        event = AppointmentEvent(
            appointment_id=appt.id,
            actor_user_id=user.id,
            from_status=old_status,
            to_status="CANCELLED",
            note=f"Hủy lịch hẹn: {data.cancel_reason_code} - {data.cancel_reason_text or ''}",
        )
        self.db.add(event)

        other_user_id = appt.seller_user_id if user.id == appt.buyer_user_id else appt.buyer_user_id
        noti = Notification(
            user_id=other_user_id,
            title="Lịch xem xe đã bị hủy",
            body=f"{user.display_name} đã hủy lịch xem xe.",
            type="APPOINTMENT",
            reference_type="appointment",
            reference_id=appt.id,
        )
        self.db.add(noti)

        await self.db.commit()
        await self.db.refresh(appt)

        # Real-time WebSocket push notification to other party
        await ws_manager.send_notification_to_user(
            other_user_id,
            {
                "id": str(noti.id),
                "title": noti.title,
                "body": noti.body,
                "type": noti.type,
                "reference_id": str(appt.id),
            },
        )
        return appt

    async def complete_appointment(self, appointment_id: uuid.UUID, user: User) -> Appointment:
        stmt = select(Appointment).where(Appointment.id == appointment_id).with_for_update()
        res = await self.db.execute(stmt)
        appt = res.scalar_one_or_none()

        if not appt:
            raise NotFoundException("Không tìm thấy lịch hẹn")
        if appt.seller_user_id != user.id:
            raise ForbiddenException("Chỉ người bán mới có quyền xác nhận buổi xem xe đã hoàn thành")
        if appt.status != "CONFIRMED":
            raise ConflictException("Lịch hẹn phải ở trạng thái đã xác nhận trước khi hoàn thành")

        appt.status = "COMPLETED"
        appt.completed_at = datetime.now(timezone.utc)

        event = AppointmentEvent(
            appointment_id=appt.id,
            actor_user_id=user.id,
            from_status="CONFIRMED",
            to_status="COMPLETED",
            note="Người bán xác nhận buổi xem xe đã diễn ra hoàn thành",
        )
        self.db.add(event)

        # Notify buyer that they can now rate the seller
        noti = Notification(
            user_id=appt.buyer_user_id,
            title="Buổi xem xe đã hoàn tất",
            body="Buổi xem xe đã kết thúc. Hãy để lại đánh giá về người bán nhé!",
            type="APPOINTMENT",
            reference_type="appointment",
            reference_id=appt.id,
        )
        self.db.add(noti)

        await self.db.commit()
        await self.db.refresh(appt)
        return appt

    async def mark_sold_appointment(self, appointment_id: uuid.UUID, user: User) -> Appointment:
        stmt = select(Appointment).where(Appointment.id == appointment_id).with_for_update()
        res = await self.db.execute(stmt)
        appt = res.scalar_one_or_none()

        if not appt:
            raise NotFoundException("Không tìm thấy lịch hẹn")
        if appt.seller_user_id != user.id:
            raise ForbiddenException("Chỉ người bán mới có quyền xác nhận bán xe")
        if appt.status not in ["CONFIRMED", "COMPLETED", "PENDING"]:
            raise ConflictException("Lịch hẹn không thể xác nhận bán xe ở trạng thái này")

        old_status = appt.status
        appt.status = "COMPLETED"
        appt.completed_at = datetime.now(timezone.utc)

        event = AppointmentEvent(
            appointment_id=appt.id,
            actor_user_id=user.id,
            from_status=old_status,
            to_status="COMPLETED",
            note="Giao dịch thành công - Người bán xác nhận đã bán xe cho khách xem xe này",
        )
        self.db.add(event)

        # Update the associated car listing to SOLD
        listing_stmt = (
            select(Listing)
            .options(selectinload(Listing.appointments))
            .where(Listing.id == appt.listing_id)
            .with_for_update()
        )
        listing = (await self.db.execute(listing_stmt)).scalar_one_or_none()
        if listing:
            prev_listing_status = listing.status
            listing.status = "SOLD"
            listing.sold_at = datetime.now(timezone.utc)

            # Cancel any other pending/confirmed appointments for this listing
            for other_appt in listing.appointments:
                if other_appt.id != appt.id and other_appt.status in ["PENDING", "CONFIRMED"]:
                    other_old_status = other_appt.status
                    other_appt.status = "CANCELLED"
                    other_appt.cancel_reason_code = "VEHICLE_SOLD"
                    other_appt.cancel_reason_text = "Xe đã được chủ xe giao dịch thành công cho khách hàng khác"
                    other_appt.cancelled_by_user_id = user.id

                    other_event = AppointmentEvent(
                        appointment_id=other_appt.id,
                        actor_user_id=user.id,
                        from_status=other_old_status,
                        to_status="CANCELLED",
                        note="Xe đã bán cho người mua khác nên lịch xem xe này tự động hủy",
                    )
                    self.db.add(other_event)

                    other_noti = Notification(
                        user_id=other_appt.buyer_user_id,
                        title="Lịch xem xe đã bị hủy",
                        body="Chiếc xe bạn đặt lịch xem đã được người bán giao dịch thành công cho khách hàng khác.",
                        type="APPOINTMENT",
                        reference_type="appointment",
                        reference_id=other_appt.id,
                    )
                    self.db.add(other_noti)

            status_event = ListingStatusEvent(
                listing_id=listing.id,
                actor_user_id=user.id,
                from_status=prev_listing_status,
                to_status="SOLD",
                reason="Giao dịch thành công qua lịch hẹn xem xe",
            )
            self.db.add(status_event)

        # Notify buyer
        noti = Notification(
            user_id=appt.buyer_user_id,
            title="Xác nhận giao dịch mua xe thành công",
            body="Người bán đã xác nhận bạn đã mua thành công chiếc xe. Chúc mừng bạn đã sở hữu xe ưng ý!",
            type="APPOINTMENT",
            reference_type="appointment",
            reference_id=appt.id,
        )
        self.db.add(noti)

        # Notify seller
        seller_noti = Notification(
            user_id=appt.seller_user_id,
            title="Giao dịch xe thành công",
            body="Hệ thống đã cập nhật trạng thái xe sang ĐÃ BÁN và hoàn tất lịch xem xe.",
            type="APPOINTMENT",
            reference_type="appointment",
            reference_id=appt.id,
        )
        self.db.add(seller_noti)

        await self.db.commit()
        await self.db.refresh(appt)
        return appt
