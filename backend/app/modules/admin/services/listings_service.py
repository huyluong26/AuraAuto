import uuid
from datetime import datetime, timezone, timedelta
from typing import List, Optional
from fastapi import BackgroundTasks
from sqlalchemy import select, func, desc, or_
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import get_password_hash
from app.core.email import send_email_sync, render_listing_status_html
from app.core.cleanup import run_system_maintenance
from app.core.cache import fast_cache
from app.modules.chats.ws_manager import ws_manager
from app.models.user import User
from app.models.listing import Listing, ListingRevision, ListingStatusEvent, ListingMedia
from app.models.appointment import Appointment, AppointmentEvent
from app.models.showroom import Showroom
from app.models.notification import Notification
from app.models.catalog import VehicleBrand
from app.models.payment import PaymentTransaction, PromotionPackage
from app.modules.payments.service import payment_service
from app.modules.admin.schemas import (
    AdminMetricsResponse,
    RejectListingRequest,
    TakeDownListingRequest,
    SubmitInspectionRequest,
    AdminUpdateListingRequest,
    VerifyShowroomRequest,
    UpdateUserStatusRequest,
    BulkUpdateUserStatusRequest,
    BulkUpdateShowroomStatusRequest,
    BulkVerifyShowroomRequest,
    BulkDeleteShowroomRequest,
    UpdateUserRoleRequest,
    AdminCreateUserRequest,
    AdminUpdateUserRequest,
    AdminCreateShowroomRequest,
    AdminUpdateShowroomRequest,
    AdminListingItemResponse,
    AdminListingDetailResponse,
    AdminAppointmentItemResponse,
    AdminAppointmentParticipant,
    AdminAppointmentListingBrief,
    AdminCancelAppointmentRequest,
    AdminPromotionPackageResponse,
    AdminCreatePromotionPackageRequest,
    AdminUpdatePromotionPackageRequest,
    AdminFeaturedListingItemResponse,
    AdminGrantFeaturedRequest,
    AdminRevokeFeaturedRequest,
    AdminPaymentTransactionItemResponse,
    AdminPromotionsOverviewResponse,
)
from app.modules.auth.schemas import UserBriefResponse, ShowroomBriefResponse
from app.shared.exceptions import NotFoundException, ConflictException, ForbiddenException
from app.shared.schemas import SuccessResponse



class AdminListingsMixin:
    db: AsyncSession

    # ==========================================
    # 2. LISTINGS MANAGEMENT
    # ==========================================
    async def list_listings(
        self,
        status_filter: Optional[str] = None,
        search: Optional[str] = None,
        limit: int = 50,
        offset: int = 0,
    ) -> List[AdminListingItemResponse]:
        db = self.db
        stmt = (
            select(Listing)
            .options(
                selectinload(Listing.revisions).selectinload(ListingRevision.media),
                selectinload(Listing.seller),
            )
            .order_by(Listing.created_at.desc())
        )

        if status_filter and status_filter.upper() != "ALL":
            if status_filter.upper() == "PENDING_REVIEW":
                stmt = stmt.where(
                    or_(
                        Listing.status == "PENDING_REVIEW",
                        Listing.revisions.any(ListingRevision.review_status == "PENDING"),
                    )
                )
            else:
                stmt = stmt.where(Listing.status == status_filter.upper())

        if search:
            kw = f"%{search.strip()}%"
            stmt = stmt.outerjoin(User, Listing.seller_user_id == User.id).where(
                or_(
                    User.display_name.ilike(kw),
                    User.email.ilike(kw),
                    User.phone.like(kw),
                    Listing.revisions.any(ListingRevision.title.ilike(kw)),
                )
            )

        stmt = stmt.limit(limit).offset(offset)
        res = await db.execute(stmt)
        listings = res.scalars().all()

        items = []
        for l in listings:
            rev = max(l.revisions, key=lambda r: r.revision_no) if l.revisions else None
            if not rev:
                continue

            media_list = rev.media or []
            primary_media = next((m for m in media_list if m.is_primary), None)
            if not primary_media and media_list:
                primary_media = media_list[0]
            primary_url = primary_media.url if primary_media else None

            has_pending = bool(
                l.published_revision_id
                and rev.review_status == "PENDING"
                and l.published_revision_id != rev.id
            )

            items.append(
                AdminListingItemResponse(
                    id=l.id,
                    status=l.status,
                    title=rev.title,
                    price_vnd=rev.price_vnd,
                    manufacture_year=rev.manufacture_year,
                    odometer_km=rev.odometer_km,
                    body_type=rev.body_type,
                    fuel_type=rev.fuel_type,
                    transmission=rev.transmission,
                    province_code=rev.province_code,
                    primary_image_url=primary_url,
                    images_count=len(media_list),
                    seller_id=l.seller.id,
                    seller_name=l.seller.display_name,
                    seller_email=l.seller.email,
                    seller_phone=l.seller.phone,
                    has_pending_revision=has_pending,
                    review_status=rev.review_status,
                    revision_no=rev.revision_no,
                    published_at=l.published_at,
                    created_at=l.created_at,
                    rejection_reason=rev.rejection_reason,
                )
            )

        return items

    async def get_listing_detail(self, id: uuid.UUID) -> AdminListingDetailResponse:
        db = self.db
        stmt = (
            select(Listing)
            .options(
                selectinload(Listing.revisions).selectinload(ListingRevision.media),
                selectinload(Listing.revisions).selectinload(ListingRevision.brand),
                selectinload(Listing.revisions).selectinload(ListingRevision.model),
                selectinload(Listing.published_revision),
                selectinload(Listing.seller),
                selectinload(Listing.status_events),
            )
            .where(Listing.id == id)
        )
        res = await db.execute(stmt)
        listing = res.scalar_one_or_none()

        if not listing:
            raise NotFoundException("Tin đăng không tồn tại")

        rev = max(listing.revisions, key=lambda r: r.revision_no) if listing.revisions else None
        if not rev:
            raise NotFoundException("Không tìm thấy thông số của tin đăng")

        media_list = [
            {
                "id": str(m.id),
                "url": m.url,
                "thumbnail_url": m.thumbnail_url,
                "media_type": m.media_type,
                "is_primary": m.is_primary,
                "sort_order": m.sort_order,
                "label": m.label,
            }
            for m in (rev.media or [])
        ]
        images = [m.url for m in (rev.media or [])]

        has_pending = bool(
            listing.published_revision_id
            and rev.review_status == "PENDING"
            and listing.published_revision_id != rev.id
        )

        published_revision_data = None
        if listing.published_revision and listing.published_revision_id != rev.id:
            pub_rev = listing.published_revision
            published_revision_data = {
                "id": str(pub_rev.id),
                "revision_no": pub_rev.revision_no,
                "title": pub_rev.title,
                "price_vnd": pub_rev.price_vnd,
                "manufacture_year": pub_rev.manufacture_year,
                "odometer_km": pub_rev.odometer_km,
                "body_type": pub_rev.body_type,
                "fuel_type": pub_rev.fuel_type,
                "transmission": pub_rev.transmission,
                "location_address": pub_rev.location_address,
                "description": pub_rev.description,
                "accident_status": pub_rev.accident_status,
                "flood_status": pub_rev.flood_status,
                "service_history": pub_rev.service_history,
            }

        events = [
            {
                "from_status": e.from_status,
                "to_status": e.to_status,
                "reason": e.reason,
                "created_at": e.created_at.isoformat() if e.created_at else None,
            }
            for e in sorted(listing.status_events, key=lambda x: x.created_at or datetime.min)
        ]

        seller_data = {
            "id": str(listing.seller.id) if listing.seller else "",
            "display_name": listing.seller.display_name if listing.seller else "Chưa xác định",
            "email": listing.seller.email if listing.seller else "",
            "phone": listing.seller.phone if listing.seller else "",
            "avatar_url": listing.seller.avatar_url if listing.seller else None,
        }

        return AdminListingDetailResponse(
            id=listing.id,
            status=listing.status,
            title=rev.title,
            price_vnd=rev.price_vnd,
            manufacture_year=rev.manufacture_year,
            odometer_km=rev.odometer_km,
            body_type=rev.body_type,
            fuel_type=rev.fuel_type,
            transmission=rev.transmission,
            origin=rev.origin,
            color=rev.color,
            interior_color=rev.interior_color,
            seats=rev.seats,
            doors=rev.doors,
            province_code=rev.province_code,
            location_address=rev.location_address,
            vin=rev.vin,
            license_plate=rev.license_plate,
            description=rev.description,
            accident_status=rev.accident_status,
            flood_status=rev.flood_status,
            service_history=rev.service_history,
            owner_count=rev.owner_count,
            repainted_parts_count=rev.repainted_parts_count,
            replaced_parts=rev.replaced_parts,
            engine_repaired=rev.engine_repaired,
            transmission_repaired=rev.transmission_repaired,
            inspection_report_pdf_url=rev.inspection_report_pdf_url,
            inspection_score=rev.inspection_score,
            inspection_inspector_name=rev.inspection_inspector_name,
            inspection_checklist=rev.inspection_checklist,
            review_status=rev.review_status,
            revision_no=rev.revision_no,
            has_pending_revision=has_pending,
            published_revision=published_revision_data,
            rejection_reason=rev.rejection_reason,
            published_at=listing.published_at,
            created_at=listing.created_at,
            seller_id=listing.seller.id if listing.seller else None,
            seller_name=listing.seller.display_name if listing.seller else None,
            seller_email=listing.seller.email if listing.seller else None,
            seller_phone=listing.seller.phone if listing.seller else None,
            seller=seller_data,
            images=images,
            media=media_list,
            events=events,
        )

    async def approve_listing(self, id: uuid.UUID, background_tasks: Optional[BackgroundTasks] = None) -> SuccessResponse:
        db = self.db
        stmt = (
            select(Listing)
            .options(selectinload(Listing.revisions), selectinload(Listing.seller))
            .where(Listing.id == id)
        )
        res = await db.execute(stmt)
        listing = res.scalar_one_or_none()
        if not listing:
            raise NotFoundException("Tin đăng không tồn tại")

        rev = max(listing.revisions, key=lambda r: r.revision_no) if listing.revisions else None
        if not rev:
            raise NotFoundException("Không tìm thấy bản ghi chi tiết xe để phê duyệt")

        old_status = listing.status
        now = datetime.now(timezone.utc)

        rev.review_status = "APPROVED"
        rev.reviewed_at = now
        rev.rejection_reason = None

        listing.published_revision_id = rev.id
        listing.status = "PUBLISHED"
        listing.published_at = listing.published_at or now

        event = ListingStatusEvent(
            listing_id=listing.id,
            from_status=old_status,
            to_status="PUBLISHED",
            reason="Quản trị viên đã phê duyệt và công khai tin đăng",
        )
        db.add(event)

        noti = Notification(
            id=uuid.uuid4(),
            user_id=listing.seller_user_id,
            title="Tin đăng của bạn đã được phê duyệt!",
            body=f"Xe '{rev.title}' hiện đã được công khai trên sàn AuraAuto.",
            type="SYSTEM",
            reference_type="listing",
            reference_id=listing.id,
        )
        db.add(noti)

        if background_tasks and listing.seller and listing.seller.email:
            html = render_listing_status_html(
                listing.seller.display_name,
                rev.title,
                "PUBLISHED",
                f"Tin đăng của bạn (phiên bản {rev.revision_no}) đã được kiểm duyệt hợp lệ và sẵn sàng tiếp cận người mua.",
            )
            background_tasks.add_task(
                send_email_sync,
                listing.seller.email,
                f"AuraAuto - Tin đăng '{rev.title}' đã được phê duyệt",
                html,
            )

        await db.commit()
        await fast_cache.invalidate_prefix("listings:")
        return SuccessResponse(message="Tin đăng đã được duyệt và công khai thành công!")

    async def reject_listing(self, id: uuid.UUID, data: RejectListingRequest, background_tasks: Optional[BackgroundTasks] = None) -> SuccessResponse:
        db = self.db
        stmt = (
            select(Listing)
            .options(selectinload(Listing.revisions), selectinload(Listing.seller))
            .where(Listing.id == id)
        )
        res = await db.execute(stmt)
        listing = res.scalar_one_or_none()
        if not listing:
            raise NotFoundException("Tin đăng không tồn tại")

        rev = max(listing.revisions, key=lambda r: r.revision_no) if listing.revisions else None
        if not rev:
            raise NotFoundException("Không tìm thấy thông số xe")

        old_status = listing.status
        now = datetime.now(timezone.utc)

        rev.review_status = "REJECTED"
        rev.rejection_reason = data.reason
        rev.reviewed_at = now

        if listing.published_revision_id and listing.published_revision_id != rev.id:
            listing.status = "PUBLISHED"
            status_desc = f"Từ chối bản sửa đổi lần {rev.revision_no}. Tin đăng tiếp tục hiển thị bản cũ."
        else:
            listing.status = "REJECTED"
            status_desc = f"Từ chối tin đăng: {data.reason}"

        event = ListingStatusEvent(
            listing_id=listing.id,
            from_status=old_status,
            to_status=listing.status,
            reason=status_desc,
        )
        db.add(event)

        noti = Notification(
            id=uuid.uuid4(),
            user_id=listing.seller_user_id,
            title="Tin đăng cần chỉnh sửa / Bị từ chối",
            body=f"Xe '{rev.title}' chưa đạt yêu cầu kiểm duyệt: {data.reason}",
            type="SYSTEM",
            reference_type="listing",
            reference_id=listing.id,
        )
        db.add(noti)

        if background_tasks and listing.seller and listing.seller.email:
            html = render_listing_status_html(
                listing.seller.display_name,
                rev.title,
                "REJECTED",
                f"Lý do từ chối: {data.reason}. Vui lòng chỉnh sửa và gửi lại yêu cầu duyệt.",
            )
            background_tasks.add_task(
                send_email_sync,
                listing.seller.email,
                f"AuraAuto - Cần chỉnh sửa tin đăng '{rev.title}'",
                html,
            )

        await db.commit()
        await fast_cache.invalidate_prefix("listings:")
        return SuccessResponse(message="Đã cập nhật trạng thái từ chối tin đăng thành công!")

    async def takedown_listing(self, id: uuid.UUID, data: TakeDownListingRequest, background_tasks: Optional[BackgroundTasks] = None) -> SuccessResponse:
        db = self.db
        stmt = (
            select(Listing)
            .options(selectinload(Listing.revisions), selectinload(Listing.seller))
            .where(Listing.id == id)
        )
        res = await db.execute(stmt)
        listing = res.scalar_one_or_none()
        if not listing:
            raise NotFoundException("Tin đăng không tồn tại")

        old_status = listing.status
        listing.status = "REMOVED"

        event = ListingStatusEvent(
            listing_id=listing.id,
            from_status=old_status,
            to_status="REMOVED",
            reason=f"Admin gỡ bỏ tin: {data.reason}",
        )
        db.add(event)

        car_title = "Xe của bạn"
        if listing.revisions:
            rev = max(listing.revisions, key=lambda r: r.revision_no)
            car_title = rev.title

        noti = Notification(
            id=uuid.uuid4(),
            user_id=listing.seller_user_id,
            title="Tin đăng đã bị gỡ bỏ",
            body=f"Xe '{car_title}' đã bị quản trị viên gỡ bỏ khỏi sàn. Lý do: {data.reason}",
            type="SYSTEM",
            reference_type="listing",
            reference_id=listing.id,
        )
        db.add(noti)

        if background_tasks and listing.seller and listing.seller.email:
            html = render_listing_status_html(
                listing.seller.display_name,
                car_title,
                "REMOVED",
                f"Tin đăng của bạn đã bị gỡ khỏi sàn. Lý do: {data.reason}",
            )
            background_tasks.add_task(
                send_email_sync,
                listing.seller.email,
                f"AuraAuto - Thông báo gỡ tin đăng '{car_title}'",
                html,
            )

        await db.commit()
        return SuccessResponse(message="Đã gỡ bỏ tin đăng thành công!")

    async def delete_listing(self, id: uuid.UUID) -> SuccessResponse:
        db = self.db
        stmt = select(Listing).where(Listing.id == id)
        res = await db.execute(stmt)
        listing = res.scalar_one_or_none()
        if not listing:
            raise NotFoundException("Tin đăng không tồn tại")

        await db.delete(listing)
        await db.commit()
        return SuccessResponse(message="Đã xóa vĩnh viễn tin đăng khỏi hệ thống")

    async def submit_inspection(self, id: uuid.UUID, data: SubmitInspectionRequest) -> SuccessResponse:
        db = self.db
        stmt = select(Listing).options(selectinload(Listing.revisions)).where(Listing.id == id)
        res = await db.execute(stmt)
        listing = res.scalar_one_or_none()
        if not listing:
            raise NotFoundException("Tin đăng không tồn tại")

        rev = max(listing.revisions, key=lambda r: r.revision_no) if listing.revisions else None
        if not rev:
            raise NotFoundException("Không tìm thấy thông số xe để bổ sung kiểm định")

        rev.inspection_score = data.inspection_score
        rev.inspection_inspector_name = data.inspection_inspector_name
        rev.inspection_report_pdf_url = data.inspection_report_pdf_url
        rev.inspection_checklist = data.inspection_checklist

        if data.accident_status:
            rev.accident_status = data.accident_status
        if data.flood_status:
            rev.flood_status = data.flood_status
        if data.service_history:
            rev.service_history = data.service_history

        await db.commit()
        return SuccessResponse(message="Đã cập nhật hồ sơ thẩm định xe thành công!")

    async def update_listing(self, id: uuid.UUID, data: AdminUpdateListingRequest) -> SuccessResponse:
        db = self.db
        stmt = select(Listing).options(selectinload(Listing.revisions)).where(Listing.id == id)
        res = await db.execute(stmt)
        listing = res.scalar_one_or_none()
        if not listing:
            raise NotFoundException("Tin đăng không tồn tại")

        rev = max(listing.revisions, key=lambda r: r.revision_no) if listing.revisions else None
        if not rev:
            raise NotFoundException("Không tìm thấy bản ghi xe")

        payload = data.model_dump(exclude_unset=True)
        for field, value in payload.items():
            if hasattr(rev, field) and value is not None:
                setattr(rev, field, value)

        await db.commit()
        return SuccessResponse(message="Cập nhật thông tin tin đăng thành công!")

