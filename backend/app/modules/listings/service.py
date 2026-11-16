import uuid
from datetime import datetime, timezone
from typing import List, Optional, Tuple
from sqlalchemy import select, func, and_, or_, desc, asc, case
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

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


class ListingService:
    def __init__(self, db: AsyncSession):
        self.db = db

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

        for idx, m in enumerate(data.media):
            media_item = ListingMedia(
                revision_id=revision.id,
                url=m.url,
                thumbnail_url=m.thumbnail_url,
                media_type=m.media_type,
                is_primary=m.is_primary if idx != 0 else True,
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

    async def submit_for_review(self, listing_id: uuid.UUID, user: User) -> Listing:
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
            raise ForbiddenException("Bạn không phải chủ sở hữu của tin đăng này")
        if listing.status not in ["DRAFT", "REJECTED"]:
            raise ConflictException(f"Tin đăng đang ở trạng thái {listing.status}, không thể gửi duyệt lại")

        listing.status = "PENDING_REVIEW"
        latest_rev = max(listing.revisions, key=lambda r: r.revision_no)
        latest_rev.review_status = "PENDING"

        event = ListingStatusEvent(
            listing_id=listing.id,
            actor_user_id=user.id,
            from_status="DRAFT",
            to_status="PENDING_REVIEW",
            reason="Người bán gửi yêu cầu duyệt tin",
        )
        self.db.add(event)
        await self.db.commit()
        await self.db.refresh(listing)
        return listing

    async def get_public_listings(
        self,
        params: ListingFilterParams,
        page: int = 1,
        page_size: int = 20,
    ) -> Tuple[List[ListingListItemResponse], int]:
        # Filter on published listings
        query = (
            select(Listing, ListingRevision, User, Showroom)
            .join(ListingRevision, Listing.published_revision_id == ListingRevision.id)
            .join(User, Listing.seller_user_id == User.id)
            .outerjoin(Showroom, Listing.showroom_id == Showroom.id)
            .options(selectinload(ListingRevision.media))
            .where(Listing.status == "PUBLISHED")
        )

        # Filters
        if params.brand_id:
            query = query.where(ListingRevision.brand_id == params.brand_id)
        if params.model_id:
            query = query.where(ListingRevision.model_id == params.model_id)
        if params.min_price_vnd:
            query = query.where(ListingRevision.price_vnd >= params.min_price_vnd)
        if params.max_price_vnd:
            query = query.where(ListingRevision.price_vnd <= params.max_price_vnd)
        if params.min_year:
            query = query.where(ListingRevision.manufacture_year >= params.min_year)
        if params.max_year:
            query = query.where(ListingRevision.manufacture_year <= params.max_year)
        if params.max_km:
            query = query.where(ListingRevision.odometer_km <= params.max_km)
        if params.body_type:
            bt = params.body_type.strip()
            query = query.where(or_(ListingRevision.body_type.ilike(f"%{bt}%"), ListingRevision.body_type == bt.upper()))
        if params.fuel_type:
            ft = params.fuel_type.strip()
            query = query.where(or_(ListingRevision.fuel_type.ilike(f"%{ft}%"), ListingRevision.fuel_type == ft.upper()))
        if params.transmission:
            tr = params.transmission.strip()
            query = query.where(or_(ListingRevision.transmission.ilike(f"%{tr}%"), ListingRevision.transmission == tr.upper()))
        if params.province_code:
            query = query.where(ListingRevision.province_code == params.province_code)
        if params.is_featured is True:
            now_utc = datetime.now(timezone.utc)
            query = query.where(Listing.is_featured.is_(True), Listing.featured_until >= now_utc)
        if params.search:
            pattern = f"%{params.search.strip()}%"
            query = query.where(
                or_(
                    ListingRevision.title.ilike(pattern),
                    ListingRevision.description.ilike(pattern),
                )
            )

        # Count total efficiently without eager loading media & relation payloads
        count_query = select(func.count()).select_from(
            query.with_only_columns(Listing.id).order_by(None).subquery()
        )
        total_res = await self.db.execute(count_query)
        total = total_res.scalar_one()

        # Priority: Ưu tiên các tin xe có gói nổi bật VIP đang còn hạn hiển thị lên đầu
        now_utc = datetime.now(timezone.utc)
        featured_priority = case(
            (and_(Listing.is_featured.is_(True), Listing.featured_until >= now_utc), 1),
            else_=0,
        )
        query = query.order_by(desc(featured_priority))

        # Sorting
        if params.sort_by == "price_asc":
            query = query.order_by(asc(ListingRevision.price_vnd))
        elif params.sort_by == "price_desc":
            query = query.order_by(desc(ListingRevision.price_vnd))
        elif params.sort_by == "year_desc":
            query = query.order_by(desc(ListingRevision.manufacture_year))
        elif params.sort_by == "km_asc":
            query = query.order_by(asc(ListingRevision.odometer_km))
        else:
            query = query.order_by(desc(Listing.published_at))

        # Pagination
        query = query.offset((page - 1) * page_size).limit(page_size)
        res = await self.db.execute(query)
        rows = res.all()

        items: List[ListingListItemResponse] = []
        for listing, rev, seller, sr in rows:
            # Resolve primary image from eager-loaded media without N+1 queries
            media_list = rev.media or []
            primary_media = next((m for m in media_list if m.is_primary), None)
            if not primary_media and media_list:
                primary_media = media_list[0]
            primary_img = primary_media.url if primary_media else None

            is_sr = listing.showroom_id is not None or (sr is not None)
            sr_name = sr.name if sr else None
            sr_verified = sr.is_verified if sr else False
            is_active_featured = bool(
                listing.is_featured and listing.featured_until and listing.featured_until > now_utc
            )

            items.append(
                ListingListItemResponse(
                    id=listing.id,
                    status=listing.status,
                    title=rev.title,
                    price_vnd=rev.price_vnd,
                    manufacture_year=rev.manufacture_year,
                    odometer_km=rev.odometer_km,
                    body_type=rev.body_type,
                    fuel_type=rev.fuel_type,
                    transmission=rev.transmission,
                    province_code=rev.province_code,
                    location_address=rev.location_address,
                    primary_image_url=primary_img,
                    seller_id=seller.id,
                    seller_name=seller.display_name,
                    seller_type="SHOWROOM" if is_sr else "INDIVIDUAL",
                    showroom_id=listing.showroom_id,
                    showroom_name=sr_name,
                    is_showroom_verified=sr_verified,
                    is_featured=is_active_featured,
                    featured_until=listing.featured_until,
                    featured_tier=listing.featured_tier,
                    published_at=listing.published_at,
                    created_at=listing.created_at,
                )
            )

        return items, total

    async def get_listing_detail(self, listing_id: uuid.UUID, current_user: Optional[User] = None) -> ListingDetailResponse:
        stmt = (
            select(Listing)
            .options(
                selectinload(Listing.seller).selectinload(User.showrooms),
                selectinload(Listing.published_revision).selectinload(ListingRevision.media),
                selectinload(Listing.published_revision).selectinload(ListingRevision.brand),
                selectinload(Listing.revisions).selectinload(ListingRevision.media),
                selectinload(Listing.revisions).selectinload(ListingRevision.brand),
            )
            .where(Listing.id == listing_id)
        )
        res = await self.db.execute(stmt)
        listing = res.scalar_one_or_none()

        if not listing:
            raise NotFoundException("Tin đăng không tồn tại")

        # Determine revision to display
        revision = None
        if listing.status in ["PUBLISHED", "SOLD", "HIDDEN"] and listing.published_revision:
            revision = listing.published_revision
        elif current_user and listing.seller_user_id == current_user.id:
            # Owner can view draft or pending revision
            revision = max(listing.revisions, key=lambda r: r.revision_no) if listing.revisions else None
        elif current_user and current_user.role == "ADMIN":
            revision = max(listing.revisions, key=lambda r: r.revision_no) if listing.revisions else None
        else:
            raise NotFoundException("Tin đăng chưa được công khai")

        if not revision:
            raise NotFoundException("Không tìm thấy thông tin chi tiết của tin đăng")

        seller = listing.seller
        showroom = seller.showrooms[0] if seller.showrooms else None

        media_list = [
            ListingMediaResponse(
                id=m.id,
                url=m.url,
                thumbnail_url=m.thumbnail_url,
                media_type=m.media_type,
                is_primary=m.is_primary,
                sort_order=m.sort_order,
                label=m.label,
            )
            for m in revision.media
        ]

        has_pending = bool(listing.published_revision_id and any(r.review_status == "PENDING" for r in (listing.revisions or [])))

        return ListingDetailResponse(
            id=listing.id,
            status=listing.status,
            version=listing.version,
            published_at=listing.published_at,
            views_count=listing.views_count,
            favorites_count=listing.favorites_count,
            is_featured=bool(listing.is_featured and listing.featured_until and listing.featured_until > datetime.now(timezone.utc)),
            featured_until=listing.featured_until,
            featured_tier=listing.featured_tier,
            revision_id=revision.id,
            brand_id=revision.brand_id,
            brand_name=revision.brand.name if revision.brand else None,
            title=revision.title,
            price_vnd=revision.price_vnd,
            manufacture_year=revision.manufacture_year,
            odometer_km=revision.odometer_km,
            body_type=revision.body_type,
            fuel_type=revision.fuel_type,
            transmission=revision.transmission,
            origin=revision.origin,
            color=revision.color,
            interior_color=revision.interior_color,
            seats=revision.seats,
            doors=revision.doors,
            province_code=revision.province_code,
            location_address=revision.location_address,
            vin=revision.vin,
            license_plate=revision.license_plate,
            revision_no=revision.revision_no,
            review_status=revision.review_status,
            has_pending_revision=has_pending,
            description=revision.description,
            accident_status=revision.accident_status,
            flood_status=revision.flood_status,
            service_history=revision.service_history,
            owner_count=revision.owner_count,
            repainted_parts_count=revision.repainted_parts_count,
            replaced_parts=revision.replaced_parts,
            engine_repaired=revision.engine_repaired,
            transmission_repaired=revision.transmission_repaired,
            inspection_report_pdf_url=revision.inspection_report_pdf_url,
            inspection_score=revision.inspection_score,
            inspection_inspector_name=revision.inspection_inspector_name,
            inspection_checklist=revision.inspection_checklist,
            media=media_list,
            seller=SellerBrief(
                id=seller.id,
                display_name=seller.display_name,
                phone=seller.phone,
                avatar_url=seller.avatar_url,
                showroom_name=showroom.name if showroom else None,
                is_showroom_verified=showroom.is_verified if showroom else False,
            ),
            seller_type="SHOWROOM" if (listing.showroom_id is not None or showroom is not None) else "INDIVIDUAL",
            showroom_id=listing.showroom_id or (showroom.id if showroom else None),
            showroom_name=showroom.name if showroom else None,
            is_showroom_verified=showroom.is_verified if showroom else False,
        )

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
                appt.status = "CANCELLED"
                appt.cancel_reason_code = "VEHICLE_SOLD"
                appt.cancel_reason_text = "Xe đã được chủ xe đánh dấu đã bán"
                appt.cancelled_by_user_id = user.id

                # Record appointment event
                event = AppointmentEvent(
                    appointment_id=appt.id,
                    actor_user_id=user.id,
                    from_status=appt.status,
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

            for idx, m in enumerate(data.media):
                media_item = ListingMedia(
                    revision_id=target_rev.id,
                    url=m.url,
                    thumbnail_url=m.thumbnail_url,
                    media_type=m.media_type,
                    is_primary=m.is_primary if idx != 0 else True,
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

            for idx, m in enumerate(data.media):
                media_item = ListingMedia(
                    revision_id=target_rev.id,
                    url=m.url,
                    thumbnail_url=m.thumbnail_url,
                    media_type=m.media_type,
                    is_primary=m.is_primary if idx != 0 else True,
                    sort_order=m.sort_order if m.sort_order is not None else idx,
                    label=m.label,
                )
                self.db.add(media_item)

        prev_status = listing.status
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
        self.db.add(event)
        await self.db.commit()
        await self.db.refresh(listing)
        return listing, target_rev
