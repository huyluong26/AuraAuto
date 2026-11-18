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



class AdminPromotionsMixin:
    db: AsyncSession

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
