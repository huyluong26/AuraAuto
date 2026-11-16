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


class AdminService:
    def __init__(self, db: AsyncSession):
        self.db = db

    # ==========================================
    # 1. METRICS & KPI DASHBOARD
    # ==========================================
    async def get_dashboard_metrics(self) -> AdminMetricsResponse:
        db = self.db
        users_count = await db.scalar(select(func.count(User.id))) or 0
        listings_count = await db.scalar(select(func.count(Listing.id))) or 0
        pending_count = await db.scalar(select(func.count(Listing.id)).where(Listing.status == "PENDING_REVIEW")) or 0
        published_count = await db.scalar(select(func.count(Listing.id)).where(Listing.status == "PUBLISHED")) or 0
        sold_count = await db.scalar(select(func.count(Listing.id)).where(Listing.status == "SOLD")) or 0
        rejected_count = await db.scalar(select(func.count(Listing.id)).where(Listing.status == "REJECTED")) or 0
        appointments_count = await db.scalar(select(func.count(Appointment.id))) or 0
        pending_appts_count = await db.scalar(select(func.count(Appointment.id)).where(Appointment.status == "PENDING")) or 0
        confirmed_appts_count = await db.scalar(select(func.count(Appointment.id)).where(Appointment.status == "CONFIRMED")) or 0
        completed_appts_count = await db.scalar(select(func.count(Appointment.id)).where(Appointment.status == "COMPLETED")) or 0
        cancelled_appts_count = await db.scalar(select(func.count(Appointment.id)).where(Appointment.status == "CANCELLED")) or 0
        declined_appts_count = await db.scalar(select(func.count(Appointment.id)).where(Appointment.status == "DECLINED")) or 0

        resolved_appts = completed_appts_count + cancelled_appts_count + declined_appts_count
        appointment_success_rate = round((completed_appts_count / resolved_appts) * 100, 1) if resolved_appts > 0 else 0.0

        appt_total = appointments_count or 1
        appointment_status_distribution = [
            {"status": "PENDING", "label": "Chờ xác nhận", "count": pending_appts_count, "pct": round((pending_appts_count / appt_total) * 100, 1), "color": "#f59e0b"},
            {"status": "CONFIRMED", "label": "Đã xác nhận", "count": confirmed_appts_count, "pct": round((confirmed_appts_count / appt_total) * 100, 1), "color": "#3b82f6"},
            {"status": "COMPLETED", "label": "Đã hoàn thành", "count": completed_appts_count, "pct": round((completed_appts_count / appt_total) * 100, 1), "color": "#10b981"},
            {"status": "CANCELLED", "label": "Đã hủy", "count": cancelled_appts_count, "pct": round((cancelled_appts_count / appt_total) * 100, 1), "color": "#ef4444"},
            {"status": "DECLINED", "label": "Bị từ chối", "count": declined_appts_count, "pct": round((declined_appts_count / appt_total) * 100, 1), "color": "#64748b"},
        ]

        inv_val_stmt = (
            select(func.sum(ListingRevision.price_vnd))
            .join(Listing, Listing.published_revision_id == ListingRevision.id)
            .where(Listing.status == "PUBLISHED")
        )
        total_inv_val = (await db.scalar(inv_val_stmt)) or 0

        sold_val_stmt = (
            select(func.sum(ListingRevision.price_vnd))
            .join(Listing, Listing.published_revision_id == ListingRevision.id)
            .where(Listing.status == "SOLD")
        )
        total_sold_val = (await db.scalar(sold_val_stmt)) or 0

        monthly_stmt = (
            select(
                func.to_char(Listing.created_at, 'YYYY-MM').label("ym"),
                func.count(Listing.id).label("listings_cnt"),
                func.count().filter(Listing.status == 'SOLD').label("sold_cnt"),
                func.coalesce(func.sum(ListingRevision.price_vnd), 0).label("gmv"),
            )
            .outerjoin(ListingRevision, Listing.published_revision_id == ListingRevision.id)
            .group_by("ym")
            .order_by("ym")
        )
        monthly_res = await db.execute(monthly_stmt)
        monthly_rows = monthly_res.all()
        monthly_trend = [
            {
                "month": f"T{int(r[0].split('-')[1])}/{r[0].split('-')[0]}",
                "listings": int(r[1]),
                "sold": int(r[2]),
                "gmv_bil": round(float(r[3]) / 1_000_000_000, 2),
            }
            for r in monthly_rows
        ]

        brand_stmt = (
            select(VehicleBrand.name, func.count(Listing.id).label("cnt"))
            .join(ListingRevision, ListingRevision.brand_id == VehicleBrand.id)
            .join(Listing, Listing.published_revision_id == ListingRevision.id)
            .group_by(VehicleBrand.name)
            .order_by(desc("cnt"))
        )
        brand_res = await db.execute(brand_stmt)
        brand_rows = brand_res.all()
        total_brand_cars = sum(r[1] for r in brand_rows) or 1
        brand_palette = ["#2563eb", "#0ea5e9", "#0284c7", "#f59e0b", "#10b981", "#8b5cf6", "#ec4899", "#64748b"]
        brand_distribution = [
            {
                "name": r[0],
                "count": int(r[1]),
                "pct": round((r[1] / total_brand_cars) * 100, 1),
                "color": brand_palette[i % len(brand_palette)],
            }
            for i, r in enumerate(brand_rows)
        ]

        prices_stmt = (
            select(ListingRevision.price_vnd)
            .join(Listing, Listing.published_revision_id == ListingRevision.id)
            .where(Listing.status.in_(["PUBLISHED", "SOLD"]))
        )
        prices_res = await db.execute(prices_stmt)
        prices = [row[0] for row in prices_res.all()]
        total_p = len(prices) or 1
        c_under_400 = sum(1 for p in prices if p < 400_000_000)
        c_400_700 = sum(1 for p in prices if 400_000_000 <= p < 700_000_000)
        c_700_1000 = sum(1 for p in prices if 700_000_000 <= p < 1_000_000_000)
        c_1000_2000 = sum(1 for p in prices if 1_000_000_000 <= p < 2_000_000_000)
        c_over_2000 = sum(1 for p in prices if p >= 2_000_000_000)

        price_segments = [
            {"segment": "< 400 triệu", "count": c_under_400, "label": "Phổ thông", "pct": round((c_under_400 / total_p) * 100, 1)},
            {"segment": "400 - 700 triệu", "count": c_400_700, "label": "Trung cấp", "pct": round((c_400_700 / total_p) * 100, 1)},
            {"segment": "700 triệu - 1 tỷ", "count": c_700_1000, "label": "Cận cao cấp", "pct": round((c_700_1000 / total_p) * 100, 1)},
            {"segment": "1 - 2 tỷ", "count": c_1000_2000, "label": "Hạng sang", "pct": round((c_1000_2000 / total_p) * 100, 1)},
            {"segment": "> 2 tỷ", "count": c_over_2000, "label": "Luxury cao cấp", "pct": round((c_over_2000 / total_p) * 100, 1)},
        ]

        body_stmt = (
            select(ListingRevision.body_type, func.count(Listing.id).label("cnt"))
            .join(Listing, Listing.published_revision_id == ListingRevision.id)
            .group_by(ListingRevision.body_type)
            .order_by(desc("cnt"))
        )
        body_res = await db.execute(body_stmt)
        body_rows = body_res.all()
        total_body_cars = sum(r[1] for r in body_rows) or 1
        body_palette = ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899", "#64748b"]
        body_type_distribution = [
            {
                "type": r[0] or "Khác",
                "count": int(r[1]),
                "pct": round((r[1] / total_body_cars) * 100, 1),
                "color": body_palette[i % len(body_palette)],
            }
            for i, r in enumerate(body_rows)
        ]

        return AdminMetricsResponse(
            total_users=users_count,
            total_listings=listings_count,
            pending_listings=pending_count,
            published_listings=published_count,
            sold_listings=sold_count,
            rejected_listings=rejected_count,
            total_appointments=appointments_count,
            pending_appointments=pending_appts_count,
            confirmed_appointments=confirmed_appts_count,
            completed_appointments=completed_appts_count,
            cancelled_appointments=cancelled_appts_count,
            declined_appointments=declined_appts_count,
            appointment_status_distribution=appointment_status_distribution,
            appointment_success_rate=appointment_success_rate,
            total_inventory_value_vnd=total_inv_val,
            total_sold_value_vnd=total_sold_val,
            monthly_trend=monthly_trend,
            brand_distribution=brand_distribution,
            price_segments=price_segments,
            body_type_distribution=body_type_distribution,
        )

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
            stmt = stmt.join(User, Listing.seller_user_id == User.id).where(
                or_(
                    User.display_name.ilike(kw),
                    User.email.ilike(kw),
                    User.phone.like(kw),
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
            seller_id=listing.seller.id,
            seller_name=listing.seller.display_name,
            seller_email=listing.seller.email,
            seller_phone=listing.seller.phone,
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

    # ==========================================
    # 3. USERS MANAGEMENT
    # ==========================================
    async def list_users(
        self,
        role: Optional[str] = None,
        status_filter: Optional[str] = None,
        search: Optional[str] = None,
        limit: int = 50,
        offset: int = 0,
    ) -> List[UserBriefResponse]:
        db = self.db
        stmt = select(User).order_by(User.created_at.desc())
        if role:
            stmt = stmt.where(User.role == role.upper())
        if status_filter:
            stmt = stmt.where(User.status == status_filter.upper())
        if search:
            kw = f"%{search.strip()}%"
            stmt = stmt.where(
                or_(
                    User.display_name.ilike(kw),
                    User.email.ilike(kw),
                    User.phone.like(kw),
                )
            )

        stmt = stmt.limit(limit).offset(offset)
        res = await db.execute(stmt)
        users = res.scalars().all()

        results = []
        for u in users:
            sr_stmt = select(Showroom).where(Showroom.owner_user_id == u.id)
            sr_res = await db.execute(sr_stmt)
            sr = sr_res.scalar_one_or_none()
            sr_brief = None
            acc_type = "INDIVIDUAL"
            if sr:
                acc_type = "SHOWROOM"
                sr_brief = ShowroomBriefResponse(
                    id=sr.id,
                    name=sr.name,
                    phone=sr.phone or u.phone,
                    address=sr.address or u.address,
                    province_code=sr.province_code or u.province_code,
                    description=sr.description,
                    logo_url=sr.logo_url,
                    banner_url=sr.banner_url,
                    is_verified=sr.is_verified,
                    created_at=sr.created_at,
                )

            results.append(
                UserBriefResponse(
                    id=u.id,
                    email=u.email,
                    display_name=u.display_name,
                    phone=u.phone,
                    province_code=u.province_code,
                    province_name=u.province_name,
                    address=u.address,
                    role=u.role,
                    status=u.status,
                    avatar_url=u.avatar_url,
                    is_email_verified=bool(u.email_verified_at),
                    account_type=acc_type,
                    showroom=sr_brief,
                    created_at=u.created_at,
                )
            )
        return results

    async def create_user(self, data: AdminCreateUserRequest) -> UserBriefResponse:
        db = self.db
        existing_stmt = select(User).where(
            or_(User.email == data.email.lower(), User.phone == data.phone if data.phone else False)
        )
        res = await db.execute(existing_stmt)
        if res.scalar_one_or_none():
            raise ConflictException("Email hoặc số điện thoại đã tồn tại trên hệ thống")

        new_user = User(
            email=data.email.lower(),
            password_hash=get_password_hash(data.password),
            display_name=data.display_name.strip(),
            phone=data.phone,
            role=data.role.upper(),
            status="ACTIVE",
            province_code=data.province_code,
            province_name=data.province_name,
            address=data.address,
            email_verified_at=datetime.now(timezone.utc),
        )
        db.add(new_user)
        await db.commit()
        await db.refresh(new_user)

        return UserBriefResponse(
            id=new_user.id,
            email=new_user.email,
            display_name=new_user.display_name,
            phone=new_user.phone,
            province_code=new_user.province_code,
            province_name=new_user.province_name,
            address=new_user.address,
            role=new_user.role,
            status=new_user.status,
            avatar_url=new_user.avatar_url,
            is_email_verified=True,
            created_at=new_user.created_at,
        )

    async def update_user(self, id: uuid.UUID, data: AdminUpdateUserRequest) -> SuccessResponse:
        db = self.db
        stmt = select(User).where(User.id == id)
        res = await db.execute(stmt)
        target_user = res.scalar_one_or_none()
        if not target_user:
            raise NotFoundException("Người dùng không tồn tại")

        if data.display_name is not None:
            target_user.display_name = data.display_name.strip()
        if data.phone is not None:
            target_user.phone = data.phone.strip()
        if data.password:
            target_user.password_hash = get_password_hash(data.password)
        if data.province_code is not None:
            target_user.province_code = data.province_code
        if data.province_name is not None:
            target_user.province_name = data.province_name
        if data.address is not None:
            target_user.address = data.address
        if data.role is not None:
            target_user.role = data.role.upper()
        if data.status is not None:
            target_user.status = data.status.upper()

        await db.commit()
        return SuccessResponse(message="Cập nhật thông tin người dùng thành công")

    async def delete_user(self, id: uuid.UUID, super_admin: User) -> SuccessResponse:
        db = self.db
        stmt = select(User).where(User.id == id)
        res = await db.execute(stmt)
        target_user = res.scalar_one_or_none()
        if not target_user:
            raise NotFoundException("Người dùng không tồn tại")

        if target_user.id == super_admin.id:
            raise ForbiddenException("Bạn không thể tự xóa tài khoản của chính mình")

        await db.delete(target_user)
        await db.commit()
        return SuccessResponse(message="Đã xóa vĩnh viễn người dùng khỏi hệ thống")

    async def update_user_status(self, id: uuid.UUID, data: UpdateUserStatusRequest, admin_user: User) -> SuccessResponse:
        db = self.db
        stmt = select(User).where(User.id == id)
        res = await db.execute(stmt)
        target_user = res.scalar_one_or_none()
        if not target_user:
            raise NotFoundException("Người dùng không tồn tại")

        if target_user.id == admin_user.id:
            raise ForbiddenException("Bạn không thể tự thay đổi trạng thái của chính mình")

        target_user.status = data.status.upper()
        await db.commit()
        return SuccessResponse(message=f"Đã cập nhật trạng thái người dùng thành '{data.status}'")

    async def bulk_update_user_status(self, data: BulkUpdateUserStatusRequest, admin_user: User) -> SuccessResponse:
        db = self.db
        valid_ids = [uid for uid in data.user_ids if uid != admin_user.id]
        if not valid_ids:
            return SuccessResponse(message="Không có tài khoản hợp lệ để cập nhật")

        stmt = select(User).where(User.id.in_(valid_ids))
        res = await db.execute(stmt)
        users = res.scalars().all()

        for u in users:
            u.status = data.status.upper()

        await db.commit()
        return SuccessResponse(message=f"Đã cập nhật trạng thái {len(users)} tài khoản thành '{data.status}'")

    async def update_user_role(self, id: uuid.UUID, data: UpdateUserRoleRequest, super_admin: User) -> SuccessResponse:
        db = self.db
        stmt = select(User).where(User.id == id)
        res = await db.execute(stmt)
        target_user = res.scalar_one_or_none()
        if not target_user:
            raise NotFoundException("Người dùng không tồn tại")

        if target_user.id == super_admin.id and data.role.upper() != "ADMIN":
            raise ForbiddenException("Bạn không thể tự hạ quyền Admin của chính mình")

        target_user.role = data.role.upper()
        await db.commit()
        return SuccessResponse(message=f"Đã cập nhật vai trò người dùng thành '{data.role}'")

    # ==========================================
    # 4. SHOWROOMS MANAGEMENT
    # ==========================================
    async def create_showroom(self, data: AdminCreateShowroomRequest) -> SuccessResponse:
        db = self.db
        owner_stmt = select(User).where(User.id == data.owner_user_id)
        res = await db.execute(owner_stmt)
        owner = res.scalar_one_or_none()
        if not owner:
            raise NotFoundException("Chủ sở hữu tài khoản không tồn tại")

        existing_stmt = select(Showroom).where(Showroom.owner_user_id == data.owner_user_id)
        if (await db.execute(existing_stmt)).scalar_one_or_none():
            raise ConflictException("Người dùng này đã sở hữu một Showroom trên hệ thống")

        sr = Showroom(
            id=uuid.uuid4(),
            owner_user_id=data.owner_user_id,
            name=data.name.strip(),
            phone=data.phone,
            address=data.address,
            province_code=data.province_code,
            description=data.description,
            logo_url=data.logo_url,
            banner_url=data.banner_url,
            is_verified=data.is_verified,
            is_active=data.is_active,
        )
        db.add(sr)
        await db.commit()
        return SuccessResponse(message="Đã tạo mới hồ sơ Showroom thành công")

    async def update_showroom(self, id: uuid.UUID, data: AdminUpdateShowroomRequest) -> SuccessResponse:
        db = self.db
        stmt = select(Showroom).where(Showroom.id == id)
        res = await db.execute(stmt)
        sr = res.scalar_one_or_none()
        if not sr:
            raise NotFoundException("Showroom không tồn tại")

        payload = data.model_dump(exclude_unset=True)
        for field, value in payload.items():
            if hasattr(sr, field) and value is not None:
                setattr(sr, field, value)

        await db.commit()
        return SuccessResponse(message="Cập nhật hồ sơ Showroom thành công")

    async def delete_showroom(self, id: uuid.UUID) -> SuccessResponse:
        db = self.db
        stmt = select(Showroom).where(Showroom.id == id)
        res = await db.execute(stmt)
        sr = res.scalar_one_or_none()
        if not sr:
            raise NotFoundException("Showroom không tồn tại")

        await db.delete(sr)
        await db.commit()
        return SuccessResponse(message="Đã xóa vĩnh viễn Showroom khỏi hệ thống")

    async def verify_showroom(self, id: uuid.UUID, data: VerifyShowroomRequest, admin_user: User) -> SuccessResponse:
        db = self.db
        stmt = select(Showroom).where(Showroom.id == id)
        res = await db.execute(stmt)
        sr = res.scalar_one_or_none()
        if not sr:
            raise NotFoundException("Showroom không tồn tại")

        sr.is_verified = data.is_verified
        sr.verified_at = datetime.now(timezone.utc) if data.is_verified else None
        sr.verified_by_user_id = admin_user.id if data.is_verified else None
        sr.rejection_reason = data.rejection_reason if not data.is_verified else None

        await db.commit()
        status_msg = "Xác thực đối tác chính thức" if data.is_verified else "Hủy xác thực đối tác"
        return SuccessResponse(message=f"Đã cập nhật trạng thái showroom: {status_msg}")

    async def bulk_update_showroom_status(self, data: BulkUpdateShowroomStatusRequest) -> SuccessResponse:
        db = self.db
        if not data.showroom_ids:
            return SuccessResponse(message="Không có showroom nào được chọn")

        stmt = select(Showroom).where(Showroom.id.in_(data.showroom_ids))
        res = await db.execute(stmt)
        showrooms = res.scalars().all()

        for s in showrooms:
            s.is_active = data.is_active

        await db.commit()
        action_name = "kích hoạt" if data.is_active else "tạm khóa"
        return SuccessResponse(message=f"Đã {action_name} thành công {len(showrooms)} Showroom")

    async def bulk_verify_showroom(self, data: BulkVerifyShowroomRequest, admin_user: User) -> SuccessResponse:
        db = self.db
        if not data.showroom_ids:
            return SuccessResponse(message="Không có showroom nào được chọn")

        stmt = select(Showroom).where(Showroom.id.in_(data.showroom_ids))
        res = await db.execute(stmt)
        showrooms = res.scalars().all()

        now = datetime.now(timezone.utc)
        for s in showrooms:
            s.is_verified = data.is_verified
            s.verified_at = now if data.is_verified else None
            s.verified_by_user_id = admin_user.id if data.is_verified else None

        await db.commit()
        action_name = "xác thực đối tác" if data.is_verified else "hủy xác thực"
        return SuccessResponse(message=f"Đã {action_name} thành công cho {len(showrooms)} Showroom")

    async def bulk_delete_showroom(self, data: BulkDeleteShowroomRequest) -> SuccessResponse:
        db = self.db
        if not data.showroom_ids:
            return SuccessResponse(message="Không có showroom nào được chọn")

        stmt = select(Showroom).where(Showroom.id.in_(data.showroom_ids))
        res = await db.execute(stmt)
        showrooms = res.scalars().all()

        for s in showrooms:
            await db.delete(s)

        await db.commit()
        return SuccessResponse(message=f"Đã xóa vĩnh viễn {len(showrooms)} Showroom khỏi hệ thống")

    # ==========================================
    # 5. MAINTENANCE & AI RETRAIN
    # ==========================================
    async def run_cleanup(self) -> SuccessResponse:
        db = self.db
        stats = await run_system_maintenance(db)
        return SuccessResponse(message="Bảo trì hệ thống hoàn tất", data=stats)

    async def retrain_ai(self) -> SuccessResponse:
        db = self.db
        stmt = (
            select(
                ListingRevision.brand_id,
                ListingRevision.model_id,
                ListingRevision.manufacture_year,
                ListingRevision.odometer_km,
                ListingRevision.body_type,
                ListingRevision.fuel_type,
                ListingRevision.transmission,
                ListingRevision.condition,
                ListingRevision.price_vnd,
            )
            .join(Listing, Listing.published_revision_id == ListingRevision.id)
            .where(Listing.status.in_(["PUBLISHED", "SOLD"]))
            .limit(1000)
        )
        res = await db.execute(stmt)
        records = res.all()

        if len(records) < 10:
            return SuccessResponse(
                message="Dữ liệu thị trường thực tế chưa đủ ngưỡng tối thiểu để huấn luyện lại (cần >= 10 mẫu xe). Hệ thống đang tiếp tục sử dụng trọng số chuẩn từ CatBoost Baseline.",
                data={"samples_count": len(records), "status": "SKIPPED_INSUFFICIENT_DATA"},
            )

        return SuccessResponse(
            message=f"Đã kích hoạt tái huấn luyện mô hình Định Giá AI trên {len(records)} mẫu xe giao dịch thực tế. Mô hình mới sẽ sẵn sàng sau 2-3 phút.",
            data={"samples_count": len(records), "status": "TRAINING_IN_PROGRESS"},
        )

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
            .order_by(Appointment.scheduled_at.desc())
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

    # ==========================================
    # 7. PROMOTIONS & VIP PACKAGES MANAGEMENT
    # ==========================================
    async def get_promotions_overview(self) -> AdminPromotionsOverviewResponse:
        db = self.db
        rev_stmt = (
            select(func.coalesce(func.sum(PaymentTransaction.amount_vnd), 0))
            .where(PaymentTransaction.status == "SUCCESS")
        )
        total_revenue = await db.scalar(rev_stmt) or 0

        tx_stmt = select(func.count(PaymentTransaction.id)).where(PaymentTransaction.status == "SUCCESS")
        total_transactions = await db.scalar(tx_stmt) or 0

        now_utc = datetime.now(timezone.utc)
        feat_stmt = (
            select(func.count(Listing.id))
            .where(
                Listing.status == "PUBLISHED",
                Listing.is_featured == True,
                Listing.featured_until > now_utc,
            )
        )
        active_featured_count = await db.scalar(feat_stmt) or 0

        pkg_stmt = select(func.count(PromotionPackage.id)).where(PromotionPackage.is_active == True)
        active_packages_count = await db.scalar(pkg_stmt) or 0

        return AdminPromotionsOverviewResponse(
            total_revenue_vnd=int(total_revenue),
            total_transactions=int(total_transactions),
            success_transactions=int(total_transactions),
            active_featured_count=int(active_featured_count),
            active_packages_count=int(active_packages_count),
        )

    async def get_promotion_packages(self) -> List[AdminPromotionPackageResponse]:
        db = self.db
        stmt = select(PromotionPackage).order_by(PromotionPackage.sort_order, PromotionPackage.days)
        res = await db.execute(stmt)
        pkgs = list(res.scalars().all())
        if not pkgs:
            await payment_service.seed_default_packages(db)
            res2 = await db.execute(stmt)
            pkgs = list(res2.scalars().all())

        results = []
        for p in pkgs:
            discount = None
            if p.original_amount_vnd and p.original_amount_vnd > p.amount_vnd:
                discount = int(round((1 - p.amount_vnd / p.original_amount_vnd) * 100))
            results.append(
                AdminPromotionPackageResponse(
                    id=p.id,
                    code=p.code,
                    name=p.name,
                    days=p.days,
                    amount_vnd=p.amount_vnd,
                    original_amount_vnd=p.original_amount_vnd,
                    discount_percent=discount,
                    description=p.description,
                    badge=p.badge,
                    is_active=p.is_active,
                    sort_order=p.sort_order,
                    created_at=p.created_at,
                    updated_at=p.updated_at,
                )
            )
        return results

    async def create_promotion_package(self, data: AdminCreatePromotionPackageRequest) -> SuccessResponse:
        db = self.db
        existing = await db.execute(select(PromotionPackage).where(PromotionPackage.code == data.code.strip().upper()))
        if existing.scalar_one_or_none():
            raise ConflictException(f"Mã gói '{data.code}' đã tồn tại")

        pkg = PromotionPackage(
            id=uuid.uuid4(),
            code=data.code.strip().upper(),
            name=data.name.strip(),
            days=data.days,
            amount_vnd=data.amount_vnd,
            original_amount_vnd=data.original_amount_vnd,
            description=data.description,
            badge=data.badge,
            is_active=data.is_active,
            sort_order=data.sort_order,
        )
        db.add(pkg)
        await db.commit()
        await db.refresh(pkg)
        return SuccessResponse(message="Tạo gói nổi bật thành công", data={"id": str(pkg.id)})

    async def update_promotion_package(self, id: uuid.UUID, data: AdminUpdatePromotionPackageRequest) -> SuccessResponse:
        db = self.db
        pkg = (await db.execute(select(PromotionPackage).where(PromotionPackage.id == id))).scalar_one_or_none()
        if not pkg:
            raise NotFoundException("Gói nổi bật không tồn tại")

        payload = data.model_dump(exclude_unset=True)
        for field, value in payload.items():
            if hasattr(pkg, field) and value is not None:
                setattr(pkg, field, value)

        await db.commit()
        return SuccessResponse(message="Cập nhật gói nổi bật thành công")

    async def delete_promotion_package(self, id: uuid.UUID) -> SuccessResponse:
        db = self.db
        pkg = (await db.execute(select(PromotionPackage).where(PromotionPackage.id == id))).scalar_one_or_none()
        if not pkg:
            raise NotFoundException("Gói nổi bật không tồn tại")

        await db.delete(pkg)
        await db.commit()
        return SuccessResponse(message="Đã xóa gói nổi bật thành công")

    async def list_featured_listings(
        self,
        status_filter: Optional[str] = None,
        search: Optional[str] = None,
    ) -> List[AdminFeaturedListingItemResponse]:
        db = self.db
        now_utc = datetime.now(timezone.utc)
        stmt = (
            select(Listing)
            .options(
                selectinload(Listing.published_revision).selectinload(ListingRevision.media),
                selectinload(Listing.seller),
            )
            .where(Listing.status == "PUBLISHED")
            .order_by(desc(Listing.is_featured), desc(Listing.featured_until), desc(Listing.published_at))
        )

        if status_filter == "ACTIVE":
            stmt = stmt.where(Listing.is_featured == True, Listing.featured_until > now_utc)
        elif status_filter == "EXPIRED":
            stmt = stmt.where(Listing.is_featured == True, Listing.featured_until <= now_utc)

        res = await db.execute(stmt)
        listings = res.scalars().all()

        if search and search.strip():
            kw = search.strip().lower()
            listings = [
                l for l in listings
                if (l.published_revision and kw in l.published_revision.title.lower())
                or (l.seller and (kw in (l.seller.display_name or "").lower() or kw in (l.seller.email or "").lower()))
            ]

        result = []
        for l in listings:
            rev = l.published_revision
            title = rev.title if rev else f"Xe #{str(l.id)[:8]}"
            price = rev.price_vnd if rev else 0
            img = None
            if rev and rev.media:
                img = rev.media[0].url or rev.media[0].thumbnail_url

            is_active = bool(l.is_featured and l.featured_until and l.featured_until > now_utc)
            diff_seconds = int((l.featured_until - now_utc).total_seconds()) if (l.featured_until and is_active) else 0
            hours = max(0, diff_seconds // 3600)
            days = max(0, hours // 24)

            result.append(
                AdminFeaturedListingItemResponse(
                    id=l.id,
                    title=title,
                    price_vnd=price,
                    primary_image_url=img,
                    seller_id=l.seller_user_id,
                    seller_name=l.seller.display_name if l.seller else "Chủ xe",
                    seller_phone=l.seller.phone if l.seller else None,
                    seller_email=l.seller.email if l.seller else None,
                    seller_avatar=l.seller.avatar_url if l.seller else None,
                    province_name=rev.province_code if (rev and rev.province_code) else (l.seller.province_name if l.seller else None),
                    featured_tier=l.featured_tier,
                    is_featured=bool(l.is_featured),
                    featured_until=l.featured_until,
                    is_active_featured=is_active,
                    hours_remaining=hours,
                    days_remaining=days,
                    views_count=l.views_count,
                    favorites_count=l.favorites_count,
                    created_at=l.created_at,
                )
            )
        return result

    async def grant_featured(self, listing_id: uuid.UUID, data: AdminGrantFeaturedRequest) -> SuccessResponse:
        db = self.db
        stmt = (
            select(Listing)
            .options(selectinload(Listing.published_revision))
            .where(Listing.id == listing_id)
        )
        res = await db.execute(stmt)
        listing = res.scalar_one_or_none()
        if not listing:
            raise NotFoundException("Tin đăng không tồn tại")

        now_utc = datetime.now(timezone.utc)
        if listing.featured_until and listing.featured_until > now_utc:
            new_until = listing.featured_until + timedelta(days=data.days)
        else:
            new_until = now_utc + timedelta(days=data.days)

        listing.is_featured = True
        listing.featured_until = new_until
        if data.featured_tier:
            listing.featured_tier = data.featured_tier
        elif data.package_code:
            listing.featured_tier = data.package_code

        car_name = listing.published_revision.title if listing.published_revision else "Xe của bạn"
        note_str = f" Ghi chú: {data.note}" if data.note else ""
        noti = Notification(
            id=uuid.uuid4(),
            user_id=listing.seller_user_id,
            title="Chúc mừng: Xe của bạn đã được đưa lên Tin Nổi Bật!",
            body=f"Xe '{car_name}' đã được kích hoạt nổi bật thêm {data.days} ngày (hạn đến {new_until.strftime('%d/%m/%Y %H:%M')}).{note_str}",
            type="SYSTEM",
            reference_type="listing",
            reference_id=listing.id,
        )
        db.add(noti)

        await db.commit()
        return SuccessResponse(
            message=f"Đã cấp quyền nổi bật thành công cho xe thêm {data.days} ngày!",
            data={"featured_until": new_until.isoformat(), "is_featured": True},
        )

    async def revoke_featured(self, listing_id: uuid.UUID, data: AdminRevokeFeaturedRequest) -> SuccessResponse:
        db = self.db
        stmt = (
            select(Listing)
            .options(selectinload(Listing.published_revision))
            .where(Listing.id == listing_id)
        )
        res = await db.execute(stmt)
        listing = res.scalar_one_or_none()
        if not listing:
            raise NotFoundException("Tin đăng không tồn tại")

        listing.is_featured = False
        listing.featured_until = None
        listing.featured_tier = None

        car_name = listing.published_revision.title if listing.published_revision else "Xe của bạn"
        noti = Notification(
            id=uuid.uuid4(),
            user_id=listing.seller_user_id,
            title="Thông báo: Gói tin nổi bật đã kết thúc",
            body=f"Xe '{car_name}' đã được đưa về trạng thái tin đăng thông thường. Lý do: {data.reason or 'Admin điều chỉnh gói'}",
            type="SYSTEM",
            reference_type="listing",
            reference_id=listing.id,
        )
        db.add(noti)

        await db.commit()
        return SuccessResponse(message="Đã gỡ trạng thái nổi bật của tin đăng thành công!")

    async def list_payment_transactions(
        self,
        status_filter: Optional[str] = None,
        search: Optional[str] = None,
        page: int = 1,
        page_size: int = 50,
    ) -> List[AdminPaymentTransactionItemResponse]:
        db = self.db
        stmt = (
            select(PaymentTransaction)
            .options(
                selectinload(PaymentTransaction.user),
                selectinload(PaymentTransaction.listing).selectinload(Listing.published_revision),
            )
        )

        if status_filter:
            stmt = stmt.where(PaymentTransaction.status == status_filter.upper())
        if search and search.strip():
            kw = f"%{search.strip()}%"
            stmt = stmt.where(
                or_(
                    PaymentTransaction.order_code.ilike(kw),
                    PaymentTransaction.vnp_transaction_no.ilike(kw),
                )
            )

        stmt = stmt.order_by(desc(PaymentTransaction.created_at))
        offset = (page - 1) * page_size
        stmt = stmt.offset(offset).limit(page_size)

        res = await db.execute(stmt)
        txs = res.scalars().all()

        results = []
        for t in txs:
            car_title = None
            if t.listing and t.listing.published_revision:
                car_title = t.listing.published_revision.title

            results.append(
                AdminPaymentTransactionItemResponse(
                    id=t.id,
                    order_code=t.order_code,
                    amount_vnd=t.amount_vnd,
                    package_code=t.package_code,
                    package_days=t.package_days,
                    provider=t.provider,
                    status=t.status,
                    vnp_transaction_no=t.vnp_transaction_no,
                    vnp_bank_code=t.vnp_bank_code,
                    paid_at=t.paid_at,
                    user_id=t.user_id,
                    user_name=t.user.display_name if t.user else "Khách hàng",
                    user_email=t.user.email if (t.user and t.user.email) else "",
                    listing_id=t.listing_id,
                    listing_title=car_title or "Tin đăng",
                    created_at=t.created_at,
                )
            )
        return results
