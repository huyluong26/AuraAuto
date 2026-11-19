import uuid
import asyncio
from datetime import datetime, timezone
from typing import List, Optional, Tuple
from fastapi import BackgroundTasks
from sqlalchemy import select, func, and_, or_, desc, asc, case
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.cache import fast_cache
from app.core.email import send_email_sync, send_email, render_listing_status_html
from app.models.listing import Listing, ListingRevision, ListingMedia, ListingStatusEvent
from app.models.appointment import Appointment, AppointmentEvent
from app.models.notification import Notification
from app.models.user import User
from app.models.showroom import Showroom
from app.modules.listings.schemas import (
    CreateListingRequest,
    UpdateListingRequest,
    ListingFilterParams,
    ListingListItemResponse,
    ListingDetailResponse,
    ListingMediaResponse,
    SellerBrief,
)
from app.shared.exceptions import NotFoundException, ForbiddenException, ConflictException, AppException



class ListingMutationMixin:
    db: AsyncSession

    async def create_draft(self, user: User, data: CreateListingRequest) -> Listing:
        # Resolve showroom if seller_type is SHOWROOM
        showroom_id = data.showroom_id
        if data.seller_type == "SHOWROOM" and not showroom_id:
            stmt = select(Showroom).where(Showroom.owner_user_id == user.id)
            res = await self.db.execute(stmt)
            existing_sr = res.scalar_one_or_none()
            if existing_sr:
                showroom_id = existing_sr.id
            elif data.custom_showroom_name:
                new_sr = Showroom(
                    owner_user_id=user.id,
                    name=data.custom_showroom_name.strip(),
                    phone=data.custom_showroom_phone or user.phone,
                    address=data.location_address or user.address,
                    province_code=data.province_code or user.province_code,
                    is_verified=False,
                )
                self.db.add(new_sr)
                await self.db.flush()
                showroom_id = new_sr.id

        listing = Listing(
            seller_user_id=user.id,
            showroom_id=showroom_id,
            status="DRAFT",
            version=1,
        )
        self.db.add(listing)
        await self.db.flush()

        revision = ListingRevision(
            listing_id=listing.id,
            revision_no=1,
            brand_id=data.brand_id,
            model_id=data.model_id,
            variant_id=data.variant_id,
            title=data.title,
            price_vnd=data.price_vnd,
            manufacture_year=data.manufacture_year,
            odometer_km=data.odometer_km,
            mileage_unknown=data.mileage_unknown,
            condition=data.condition,
            body_type=data.body_type,
            fuel_type=data.fuel_type,
            transmission=data.transmission,
            origin=data.origin,
            color=data.color,
            interior_color=data.interior_color,
            seats=data.seats,
            doors=data.doors,
            province_code=data.province_code,
            location_address=data.location_address,
            vin=data.vin,
            license_plate=data.license_plate,
            description=data.description,
            accident_status=data.accident_status,
            flood_status=data.flood_status,
            service_history=data.service_history,
            owner_count=data.owner_count,
            repainted_parts_count=data.repainted_parts_count,
            replaced_parts=data.replaced_parts,
            engine_repaired=data.engine_repaired,
            transmission_repaired=data.transmission_repaired,
            review_status="DRAFT",
        )
        self.db.add(revision)
        await self.db.flush()

        chosen_primary_idx = next((i for i, m in enumerate(data.media) if m.is_primary), 0) if data.media else 0
        for idx, m in enumerate(data.media):
            media_item = ListingMedia(
                revision_id=revision.id,
                url=m.url,
                thumbnail_url=m.thumbnail_url,
                media_type=m.media_type,
                is_primary=(idx == chosen_primary_idx),
                sort_order=m.sort_order or idx,
                label=m.label,
            )
            self.db.add(media_item)

        event = ListingStatusEvent(
            listing_id=listing.id,
            actor_user_id=user.id,
            from_status=None,
            to_status="DRAFT",
            reason="Tạo bản nháp tin đăng mới",
        )
        self.db.add(event)
        await self.db.commit()
        await self.db.refresh(listing)
        return listing

    async def submit_for_review(
        self,
        listing_id: uuid.UUID,
        user: User,
        background_tasks: Optional[BackgroundTasks] = None,
    ) -> Listing:
        stmt = (
            select(Listing)
            .options(selectinload(Listing.revisions))
            .where(Listing.id == listing_id)
        )
        res = await self.db.execute(stmt)
        listing = res.scalar_one_or_none()

        if not listing:
            raise NotFoundException("Tin đăng không tồn tại")
        if listing.seller_user_id != user.id and user.role != "ADMIN":
            raise ForbiddenException("Bạn không phải chủ sở hữu của tin đăng này")
        if listing.status not in ["DRAFT", "REJECTED"]:
            raise ConflictException(f"Tin đăng đang ở trạng thái {listing.status}, không thể gửi duyệt lại")

        latest_rev = max(listing.revisions, key=lambda r: r.revision_no)
        old_status = listing.status
        now_utc = datetime.now(timezone.utc)
        is_internal_staff = user.role in ("ADMIN", "INSPECTOR", "SUPPORT")

        if is_internal_staff:
            listing.status = "PUBLISHED"
            listing.published_revision_id = latest_rev.id
            listing.published_at = listing.published_at or now_utc

            latest_rev.review_status = "APPROVED"
            latest_rev.reviewed_at = now_utc
            latest_rev.reviewed_by_user_id = user.id
            latest_rev.rejection_reason = None

            event = ListingStatusEvent(
                listing_id=listing.id,
                actor_user_id=user.id,
                from_status=old_status,
                to_status="PUBLISHED",
                reason="Quản trị viên đăng tin - Hệ thống tự động phê duyệt và xuất bản trực tiếp",
            )

            # Gửi email thông báo xuất bản thành công cho nhân sự/admin
            if user.email:
                html = render_listing_status_html(
                    user.display_name,
                    latest_rev.title,
                    "PUBLISHED",
                    "Tin đăng xe của bạn đã được phê duyệt tự động và xuất bản trực tiếp lên sàn AuraAuto.",
                    str(listing.id),
                )
                subject = f"AuraAuto - Chúc mừng! Tin đăng '{latest_rev.title}' đã xuất bản"
                if background_tasks:
                    background_tasks.add_task(send_email_sync, user.email, subject, html)
                else:
                    asyncio.create_task(send_email(user.email, subject, html))
        else:
            listing.status = "PENDING_REVIEW"
            latest_rev.review_status = "PENDING"

            event = ListingStatusEvent(
                listing_id=listing.id,
                actor_user_id=user.id,
                from_status=old_status,
                to_status="PENDING_REVIEW",
                reason="Người bán gửi yêu cầu duyệt tin",
            )

            # Tạo thông báo hệ thống cho khách hàng
            noti = Notification(
                id=uuid.uuid4(),
                user_id=user.id,
                title="Tin đăng xe đang chờ duyệt",
                body=f"Xe '{latest_rev.title}' đã gửi tới Ban Quản Trị và đang được kiểm định trong vòng 24 giờ.",
                type="SYSTEM",
                reference_type="listing",
                reference_id=listing.id,
            )
            self.db.add(noti)

            # Gửi email xác nhận đang chờ duyệt cho khách hàng
            if user.email:
                html = render_listing_status_html(
                    user.display_name,
                    latest_rev.title,
                    "PENDING_REVIEW",
                    "Hồ sơ tin đăng của bạn đã được gửi tới Ban Quản Trị. Đội ngũ kiểm định viên AuraAuto sẽ tiến hành kiểm định kỹ thuật và phản hồi trong vòng 24 giờ làm việc.",
                    str(listing.id),
                )
                subject = f"AuraAuto - Hồ sơ tin đăng '{latest_rev.title}' đang chờ phê duyệt"
                if background_tasks:
                    background_tasks.add_task(send_email_sync, user.email, subject, html)
                else:
                    asyncio.create_task(send_email(user.email, subject, html))

        self.db.add(event)
        await self.db.commit()
        await self.db.refresh(listing)

        if not is_internal_staff:
            try:
                from app.modules.chats.ws_manager import ws_manager
                await ws_manager.send_notification_to_user(
                    user.id,
                    {
                        "id": str(noti.id),
                        "title": noti.title,
                        "body": noti.body,
                        "type": "LISTING_STATUS_CHANGE",
                        "status": "PENDING_REVIEW",
                        "reference_type": "listing",
                        "reference_id": str(listing.id),
                        "listing_id": str(listing.id),
                        "listing_title": latest_rev.title,
                    },
                )
            except Exception:
                pass

        return listing


    async def mark_sold(self, listing_id: uuid.UUID, user: User) -> Listing:
        stmt = (
            select(Listing)
            .options(selectinload(Listing.appointments))
            .where(Listing.id == listing_id)
            .with_for_update()
        )
        res = await self.db.execute(stmt)
        listing = res.scalar_one_or_none()

        if not listing:
            raise NotFoundException("Tin đăng không tồn tại")
        if listing.seller_user_id != user.id:
            raise ForbiddenException("Chỉ người bán mới có quyền đánh dấu đã bán xe")
        if listing.status == "SOLD":
            raise ConflictException("Tin đăng này đã được đánh dấu bán trước đó")

        listing.status = "SOLD"
        listing.sold_at = datetime.now(timezone.utc)

        # Automatically cancel open appointments
        now = datetime.now(timezone.utc)
        for appt in listing.appointments:
            if appt.status in ["PENDING", "CONFIRMED"]:
                old_status = appt.status
                appt.status = "CANCELLED"
                appt.cancel_reason_code = "VEHICLE_SOLD"
                appt.cancel_reason_text = "Xe đã được chủ xe đánh dấu đã bán"
                appt.cancelled_by_user_id = user.id

                # Record appointment event
                event = AppointmentEvent(
                    appointment_id=appt.id,
                    actor_user_id=user.id,
                    from_status=old_status,
                    to_status="CANCELLED",
                    note="Xe đã bán nên lịch xem xe tự động bị hủy",
                )
                self.db.add(event)

                # Send notification to buyer
                noti = Notification(
                    user_id=appt.buyer_user_id,
                    title="Lịch xem xe đã bị hủy",
                    body="Chiếc xe bạn đặt lịch xem đã được người bán đánh dấu đã bán.",
                    type="APPOINTMENT",
                    reference_type="appointment",
                    reference_id=appt.id,
                )
                self.db.add(noti)

        status_event = ListingStatusEvent(
            listing_id=listing.id,
            actor_user_id=user.id,
            from_status="PUBLISHED",
            to_status="SOLD",
            reason="Người bán đánh dấu xe đã bán thành công",
        )
        self.db.add(status_event)
        await self.db.commit()
        await self.db.refresh(listing)
        return listing

    async def add_media_items(
        self,
        listing_id: uuid.UUID,
        user: User,
        media_items: List[dict],
    ) -> List[ListingMedia]:
        """Thêm danh sách nhiều ảnh vào bản revision mới nhất của tin đăng."""
        stmt = (
            select(Listing)
            .options(selectinload(Listing.revisions))
            .where(Listing.id == listing_id)
        )
        res = await self.db.execute(stmt)
        listing = res.scalar_one_or_none()
        if not listing:
            raise NotFoundException("Tin đăng không tồn tại")
        if listing.seller_user_id != user.id:
            raise ForbiddenException("Bạn không phải chủ sở hữu tin đăng này")

        if not listing.revisions:
            raise NotFoundException("Bản sửa đổi của tin đăng không tồn tại")

        revisions = sorted(listing.revisions, key=lambda r: r.revision_no, reverse=True)
        target_rev = revisions[0]

        created_media = []
        for idx, m in enumerate(media_items):
            media = ListingMedia(
                revision_id=target_rev.id,
                url=m["url"],
                thumbnail_url=m.get("thumbnail_url"),
                media_type=m.get("media_type", "IMAGE"),
                is_primary=bool(m.get("is_primary", False)),
                sort_order=m.get("sort_order", idx),
                label=m.get("label"),
            )
            self.db.add(media)
            created_media.append(media)

        await self.db.commit()
        return created_media

    async def get_editable_listing(self, listing_id: uuid.UUID, user: User) -> dict:
        """Lấy toàn bộ thông tin mới nhất của tin đăng để người bán đưa vào form chỉnh sửa."""
        stmt = (
            select(Listing)
            .options(
                selectinload(Listing.revisions).selectinload(ListingRevision.media),
                selectinload(Listing.revisions).selectinload(ListingRevision.brand),
                selectinload(Listing.revisions).selectinload(ListingRevision.model),
                selectinload(Listing.published_revision),
            )
            .where(Listing.id == listing_id)
        )
        res = await self.db.execute(stmt)
        listing = res.scalar_one_or_none()
        if not listing:
            raise NotFoundException("Tin đăng không tồn tại")
        if listing.seller_user_id != user.id and user.role != "ADMIN":
            raise ForbiddenException("Bạn không có quyền chỉnh sửa tin đăng này")

        latest_rev = max(listing.revisions, key=lambda r: r.revision_no) if listing.revisions else None
        if not latest_rev:
            raise NotFoundException("Tin đăng chưa có bản sửa đổi nào")

        has_pending = bool(
            listing.published_revision_id
            and latest_rev.review_status == "PENDING"
            and listing.published_revision_id != latest_rev.id
        )

        media_items = [
            {
                "id": str(m.id),
                "url": m.url,
                "thumbnail_url": m.thumbnail_url,
                "media_type": m.media_type,
                "is_primary": m.is_primary,
                "sort_order": m.sort_order,
                "label": m.label,
            }
            for m in (latest_rev.media or [])
        ]

        return {
            "listing_id": str(listing.id),
            "status": listing.status,
            "revision_no": latest_rev.revision_no,
            "review_status": latest_rev.review_status,
            "has_pending_revision": has_pending,
            "rejection_reason": latest_rev.rejection_reason,
            "brand_id": str(latest_rev.brand_id),
            "brand_name": latest_rev.brand.name if latest_rev.brand else None,
            "model_id": str(latest_rev.model_id),
            "model_name": latest_rev.model.name if latest_rev.model else None,
            "variant_id": str(latest_rev.variant_id) if latest_rev.variant_id else None,
            "title": latest_rev.title,
            "price_vnd": latest_rev.price_vnd,
            "manufacture_year": latest_rev.manufacture_year,
            "odometer_km": latest_rev.odometer_km or 0,
            "mileage_unknown": latest_rev.mileage_unknown,
            "condition": latest_rev.condition,
            "body_type": latest_rev.body_type,
            "fuel_type": latest_rev.fuel_type,
            "transmission": latest_rev.transmission,
            "origin": latest_rev.origin,
            "color": latest_rev.color,
            "interior_color": latest_rev.interior_color,
            "seats": latest_rev.seats or 5,
            "doors": latest_rev.doors or 4,
            "province_code": latest_rev.province_code,
            "location_address": latest_rev.location_address or "",
            "vin": latest_rev.vin or "",
            "license_plate": latest_rev.license_plate or "",
            "description": latest_rev.description or "",
            "accident_status": latest_rev.accident_status,
            "flood_status": latest_rev.flood_status,
            "service_history": latest_rev.service_history,
            "owner_count": latest_rev.owner_count or 1,
            "repainted_parts_count": latest_rev.repainted_parts_count or 0,
            "replaced_parts": latest_rev.replaced_parts or "",
            "engine_repaired": latest_rev.engine_repaired,
            "transmission_repaired": latest_rev.transmission_repaired,
            "media": media_items,
        }

    async def update_listing(
        self,
        listing_id: uuid.UUID,
        data: UpdateListingRequest,
        user: User,
        background_tasks: Optional[BackgroundTasks] = None,
    ) -> Tuple[Listing, ListingRevision]:
        """
        Cập nhật toàn diện tin đăng xe:
        - Nếu tin đang PUBLISHED: Giữ nguyên trạng thái PUBLISHED và published_revision_id để tin trên sàn vẫn chạy bình thường với dữ liệu cũ. Tạo/cập nhật một bản revision mới ở trạng thái review_status="PENDING" để chờ admin duyệt.
        - Nếu tin đang DRAFT hoặc REJECTED: Cập nhật và đưa tin vào PENDING_REVIEW để admin thẩm định xuất bản lần đầu.
        """
        stmt = (
            select(Listing)
            .options(
                selectinload(Listing.revisions).selectinload(ListingRevision.media),
                selectinload(Listing.seller),
            )
            .where(Listing.id == listing_id)
            .with_for_update()
        )
        res = await self.db.execute(stmt)
        listing = res.scalar_one_or_none()

        if not listing:
            raise NotFoundException("Tin đăng không tồn tại")
        if listing.seller_user_id != user.id and user.role != "ADMIN":
            raise ForbiddenException("Bạn không có quyền chỉnh sửa tin đăng này")

        latest_rev = max(listing.revisions, key=lambda r: r.revision_no) if listing.revisions else None

        # Nếu revision mới nhất đang ở trạng thái PENDING (chưa duyệt), cập nhật trực tiếp vào revision đó
        if latest_rev and latest_rev.review_status == "PENDING":
            target_rev = latest_rev
            target_rev.brand_id = data.brand_id
            target_rev.model_id = data.model_id
            target_rev.variant_id = data.variant_id
            target_rev.title = data.title
            target_rev.price_vnd = data.price_vnd
            target_rev.manufacture_year = data.manufacture_year
            target_rev.odometer_km = data.odometer_km
            target_rev.mileage_unknown = data.mileage_unknown
            target_rev.condition = data.condition
            target_rev.body_type = data.body_type
            target_rev.fuel_type = data.fuel_type
            target_rev.transmission = data.transmission
            target_rev.origin = data.origin
            target_rev.color = data.color
            target_rev.interior_color = data.interior_color
            target_rev.seats = data.seats
            target_rev.doors = data.doors
            target_rev.province_code = data.province_code
            target_rev.location_address = data.location_address
            target_rev.vin = data.vin
            target_rev.license_plate = data.license_plate
            target_rev.description = data.description
            target_rev.accident_status = data.accident_status
            target_rev.flood_status = data.flood_status
            target_rev.service_history = data.service_history
            target_rev.owner_count = data.owner_count
            target_rev.repainted_parts_count = data.repainted_parts_count
            target_rev.replaced_parts = data.replaced_parts
            target_rev.engine_repaired = data.engine_repaired
            target_rev.transmission_repaired = data.transmission_repaired
            target_rev.rejection_reason = None

            # Xóa các ảnh cũ và thêm lại danh sách mới
            for old_m in list(target_rev.media):
                await self.db.delete(old_m)
            await self.db.flush()

            chosen_primary_idx = next((i for i, m in enumerate(data.media) if m.is_primary), 0) if data.media else 0
            for idx, m in enumerate(data.media):
                media_item = ListingMedia(
                    revision_id=target_rev.id,
                    url=m.url,
                    thumbnail_url=m.thumbnail_url,
                    media_type=m.media_type,
                    is_primary=(idx == chosen_primary_idx),
                    sort_order=m.sort_order if m.sort_order is not None else idx,
                    label=m.label,
                )
                self.db.add(media_item)

        else:
            # Tạo một bản revision mới tiếp theo (revision_no tăng 1)
            next_rev_no = (latest_rev.revision_no + 1) if latest_rev else 1
            target_rev = ListingRevision(
                listing_id=listing.id,
                revision_no=next_rev_no,
                brand_id=data.brand_id,
                model_id=data.model_id,
                variant_id=data.variant_id,
                title=data.title,
                price_vnd=data.price_vnd,
                manufacture_year=data.manufacture_year,
                odometer_km=data.odometer_km,
                mileage_unknown=data.mileage_unknown,
                condition=data.condition,
                body_type=data.body_type,
                fuel_type=data.fuel_type,
                transmission=data.transmission,
                origin=data.origin,
                color=data.color,
                interior_color=data.interior_color,
                seats=data.seats,
                doors=data.doors,
                province_code=data.province_code,
                location_address=data.location_address,
                vin=data.vin,
                license_plate=data.license_plate,
                description=data.description,
                accident_status=data.accident_status,
                flood_status=data.flood_status,
                service_history=data.service_history,
                owner_count=data.owner_count,
                repainted_parts_count=data.repainted_parts_count,
                replaced_parts=data.replaced_parts,
                engine_repaired=data.engine_repaired,
                transmission_repaired=data.transmission_repaired,
                review_status="PENDING",
            )
            self.db.add(target_rev)
            await self.db.flush()

            chosen_primary_idx = next((i for i, m in enumerate(data.media) if m.is_primary), 0) if data.media else 0
            for idx, m in enumerate(data.media):
                media_item = ListingMedia(
                    revision_id=target_rev.id,
                    url=m.url,
                    thumbnail_url=m.thumbnail_url,
                    media_type=m.media_type,
                    is_primary=(idx == chosen_primary_idx),
                    sort_order=m.sort_order if m.sort_order is not None else idx,
                    label=m.label,
                )
                self.db.add(media_item)

        prev_status = listing.status
        now_utc = datetime.now(timezone.utc)
        is_internal_staff = user.role in ("ADMIN", "INSPECTOR", "SUPPORT")

        if is_internal_staff:
            target_rev.review_status = "APPROVED"
            target_rev.reviewed_at = now_utc
            target_rev.reviewed_by_user_id = user.id
            target_rev.rejection_reason = None

            listing.published_revision_id = target_rev.id
            listing.status = "PUBLISHED"
            listing.published_at = listing.published_at or now_utc

            event = ListingStatusEvent(
                listing_id=listing.id,
                actor_user_id=user.id,
                from_status=prev_status,
                to_status="PUBLISHED",
                reason=f"Quản trị viên cập nhật tin xe (Phiên bản #{target_rev.revision_no}) - Tự động duyệt và xuất bản trực tiếp",
            )

            # Tạo thông báo hệ thống cho chủ xe (seller)
            target_user_id = listing.seller_user_id
            seller_name = listing.seller.display_name if listing.seller else "Quý khách"
            seller_email = listing.seller.email if listing.seller else None

            noti = Notification(
                id=uuid.uuid4(),
                user_id=target_user_id,
                title="Tin đăng đã được quản trị viên cập nhật",
                body=f"Bản cập nhật xe '{target_rev.title}' (phiên bản #{target_rev.revision_no}) đã được quản trị viên phê duyệt và xuất bản trực tiếp.",
                type="SYSTEM",
                reference_type="listing",
                reference_id=listing.id,
            )
            self.db.add(noti)

            if seller_email:
                html = render_listing_status_html(
                    seller_name,
                    target_rev.title,
                    "PUBLISHED",
                    f"Bản cập nhật thông tin xe (Phiên bản #{target_rev.revision_no}) đã được kiểm định và xuất bản trực tiếp lên sàn AuraAuto.",
                    str(listing.id),
                )
                subject = f"AuraAuto - Bản cập nhật tin đăng '{target_rev.title}' đã xuất bản"
                if background_tasks:
                    background_tasks.add_task(send_email_sync, seller_email, subject, html)
                else:
                    asyncio.create_task(send_email(seller_email, subject, html))
        else:
            # Nếu tin trước đó là DRAFT hoặc REJECTED, chuyển sang PENDING_REVIEW
            if listing.status in ("DRAFT", "REJECTED"):
                listing.status = "PENDING_REVIEW"
            # LƯU Ý QUAN TRỌNG: Nếu listing.status == 'PUBLISHED', giữ nguyên PUBLISHED
            # và giữ nguyên published_revision_id để tin công khai ngoài sàn vẫn hiển thị dữ liệu cũ trong lúc chờ duyệt!

            event = ListingStatusEvent(
                listing_id=listing.id,
                actor_user_id=user.id,
                from_status=prev_status,
                to_status=listing.status,
                reason=f"Người bán gửi bản chỉnh sửa tin đăng (Phiên bản #{target_rev.revision_no}) chờ phê duyệt",
            )

            # Tạo thông báo hệ thống cho khách hàng
            noti = Notification(
                id=uuid.uuid4(),
                user_id=user.id,
                title="Bản chỉnh sửa tin đăng đang chờ duyệt",
                body=f"Bản cập nhật xe '{target_rev.title}' (lần #{target_rev.revision_no}) đã được gửi tới Ban Quản Trị thẩm định lại.",
                type="SYSTEM",
                reference_type="listing",
                reference_id=listing.id,
            )
            self.db.add(noti)

            if user.email:
                html = render_listing_status_html(
                    user.display_name,
                    target_rev.title,
                    "PENDING_REVIEW",
                    f"Bản chỉnh sửa thông tin xe (Phiên bản #{target_rev.revision_no}) đã được gửi tới Ban Quản Trị để thẩm định lại.",
                    str(listing.id),
                )
                subject = f"AuraAuto - Bản chỉnh sửa tin đăng '{target_rev.title}' đang chờ phê duyệt"
                if background_tasks:
                    background_tasks.add_task(send_email_sync, user.email, subject, html)
                else:
                    asyncio.create_task(send_email(user.email, subject, html))

            try:
                from app.modules.chats.ws_manager import ws_manager
                await ws_manager.send_notification_to_user(
                    user.id,
                    {
                        "id": str(noti.id),
                        "title": noti.title,
                        "body": noti.body,
                        "type": "LISTING_STATUS_CHANGE",
                        "status": "PENDING_REVIEW",
                        "reference_type": "listing",
                        "reference_id": str(listing.id),
                        "listing_id": str(listing.id),
                        "listing_title": target_rev.title,
                    },
                )
            except Exception:
                pass

        self.db.add(event)
        await self.db.commit()
        await self.db.refresh(listing)
        return listing, target_rev
