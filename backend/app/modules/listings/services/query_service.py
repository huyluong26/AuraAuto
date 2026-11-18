import uuid
from datetime import datetime, timezone
from typing import List, Optional, Tuple
from sqlalchemy import select, func, and_, or_, desc, asc, case
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.cache import fast_cache
from app.models.listing import Listing, ListingRevision, ListingMedia, ListingStatusEvent
from app.models.appointment import Appointment, AppointmentEvent
from app.models.notification import Notification
from app.models.user import User
from app.models.showroom import Showroom
from app.models.catalog import VehicleBrand
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



class ListingQueryMixin:
    db: AsyncSession

    async def get_featured_quick(self, limit: int = 6) -> List[ListingListItemResponse]:
        """Truy vấn siêu tốc danh sách tin xe nổi bật VIP cho trang chủ (1 SQL query duy nhất)."""
        now_utc = datetime.now(timezone.utc)
        stmt = (
            select(Listing, ListingRevision, User, Showroom, ListingMedia.url)
            .join(ListingRevision, Listing.published_revision_id == ListingRevision.id)
            .join(User, Listing.seller_user_id == User.id)
            .outerjoin(Showroom, Listing.showroom_id == Showroom.id)
            .outerjoin(
                ListingMedia,
                and_(
                    ListingMedia.revision_id == ListingRevision.id,
                    ListingMedia.is_primary.is_(True),
                ),
            )
            .where(
                Listing.status == "PUBLISHED",
                Listing.is_featured.is_(True),
                Listing.featured_until >= now_utc,
            )
            .order_by(desc(Listing.featured_until), desc(Listing.published_at))
            .limit(limit)
        )
        res = await self.db.execute(stmt)
        rows = res.all()

        items: List[ListingListItemResponse] = []
        for listing, rev, seller, sr, primary_img in rows:
            is_sr = listing.showroom_id is not None or (sr is not None)
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
                    showroom_name=sr.name if sr else None,
                    is_showroom_verified=sr.is_verified if sr else False,
                    is_featured=True,
                    featured_until=listing.featured_until,
                    featured_tier=listing.featured_tier,
                    published_at=listing.published_at,
                    created_at=listing.created_at,
                )
            )
        return items

    async def get_public_listings(
        self,
        params: ListingFilterParams,
        page: int = 1,
        page_size: int = 20,
    ) -> Tuple[List[ListingListItemResponse], int]:
        # Tối ưu hóa truy vấn: Direct Outer Join ListingMedia cho ảnh chính (Loại bỏ N+1 và selectinload round-trip)
        query = (
            select(Listing, ListingRevision, User, Showroom, ListingMedia.url)
            .join(ListingRevision, Listing.published_revision_id == ListingRevision.id)
            .join(User, Listing.seller_user_id == User.id)
            .outerjoin(Showroom, Listing.showroom_id == Showroom.id)
            .outerjoin(VehicleBrand, ListingRevision.brand_id == VehicleBrand.id)
            .outerjoin(
                ListingMedia,
                and_(
                    ListingMedia.revision_id == ListingRevision.id,
                    ListingMedia.is_primary.is_(True),
                ),
            )
            .where(Listing.status == "PUBLISHED")
        )

        has_revision_filters = False

        # Filters
        if params.brand_id:
            query = query.where(ListingRevision.brand_id == params.brand_id)
            has_revision_filters = True
        if params.brand and params.brand.strip() and params.brand.strip().lower() != "tất cả":
            b = params.brand.strip()
            b_hyphen = b.replace(" ", "-")
            b_space = b.replace("-", " ")
            first_word = b.split()[0] if b.split() else b

            brand_conditions = [
                VehicleBrand.name.ilike(f"%{b}%"),
                VehicleBrand.name.ilike(f"%{b_hyphen}%"),
                VehicleBrand.name.ilike(f"%{b_space}%"),
                VehicleBrand.slug.ilike(f"%{b.lower()}%"),
                VehicleBrand.slug.ilike(f"%{b_hyphen.lower()}%"),
                ListingRevision.title.ilike(f"%{b}%"),
                ListingRevision.title.ilike(f"%{b_hyphen}%"),
                ListingRevision.title.ilike(f"%{b_space}%"),
                ListingRevision.description.ilike(f"%{b}%"),
                ListingRevision.description.ilike(f"%{b_hyphen}%"),
            ]
            if len(first_word) >= 3:
                brand_conditions.append(ListingRevision.title.ilike(f"%{first_word}%"))
                brand_conditions.append(VehicleBrand.name.ilike(f"%{first_word}%"))

            query = query.where(or_(*brand_conditions))
            has_revision_filters = True
        if params.model_id:
            query = query.where(ListingRevision.model_id == params.model_id)
            has_revision_filters = True
        if params.min_price_vnd:
            query = query.where(ListingRevision.price_vnd >= params.min_price_vnd)
            has_revision_filters = True
        if params.max_price_vnd:
            query = query.where(ListingRevision.price_vnd <= params.max_price_vnd)
            has_revision_filters = True
        if params.min_year:
            query = query.where(ListingRevision.manufacture_year >= params.min_year)
            has_revision_filters = True
        if params.max_year:
            query = query.where(ListingRevision.manufacture_year <= params.max_year)
            has_revision_filters = True
        if params.max_km:
            query = query.where(ListingRevision.odometer_km <= params.max_km)
            has_revision_filters = True
        if params.body_type:
            bt = params.body_type.strip()
            query = query.where(or_(ListingRevision.body_type.ilike(f"%{bt}%"), ListingRevision.body_type == bt.upper()))
            has_revision_filters = True
        if params.fuel_type:
            ft = params.fuel_type.strip()
            query = query.where(or_(ListingRevision.fuel_type.ilike(f"%{ft}%"), ListingRevision.fuel_type == ft.upper()))
            has_revision_filters = True
        if params.transmission:
            tr = params.transmission.strip()
            query = query.where(or_(ListingRevision.transmission.ilike(f"%{tr}%"), ListingRevision.transmission == tr.upper()))
            has_revision_filters = True
        if params.province_code:
            query = query.where(ListingRevision.province_code == params.province_code)
            has_revision_filters = True
        if params.is_featured is True:
            now_utc = datetime.now(timezone.utc)
            query = query.where(Listing.is_featured.is_(True), Listing.featured_until >= now_utc)
            has_revision_filters = True
        if params.search and params.search.strip():
            s = params.search.strip()
            words = [w for w in s.split() if len(w) > 0]
            if len(words) > 1:
                word_conditions = [
                    or_(
                        ListingRevision.title.ilike(f"%{w}%"),
                        ListingRevision.description.ilike(f"%{w}%"),
                    )
                    for w in words
                ]
                query = query.where(and_(*word_conditions))
            else:
                pattern = f"%{s}%"
                query = query.where(
                    or_(
                        ListingRevision.title.ilike(pattern),
                        ListingRevision.description.ilike(pattern),
                    )
                )
            has_revision_filters = True

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

        # Pagination & Query execution
        paginated_query = query.offset((page - 1) * page_size).limit(page_size)
        res = await self.db.execute(paginated_query)
        rows = res.all()

        # Fast Count: Nếu trang đầu tiên và kết quả ít hơn page_size thì biết chắc chắn tổng số
        if page == 1 and len(rows) < page_size:
            total = len(rows)
        elif not has_revision_filters:
            # Query count nhanh từ index idx_listing_status_published_at
            total_stmt = select(func.count(Listing.id)).where(Listing.status == "PUBLISHED")
            total = (await self.db.execute(total_stmt)).scalar_one()
        else:
            count_query = select(func.count()).select_from(
                query.with_only_columns(Listing.id).order_by(None).subquery()
            )
            total = (await self.db.execute(count_query)).scalar_one()

        items: List[ListingListItemResponse] = []
        for listing, rev, seller, sr, primary_img in rows:
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
        load_options = [
            selectinload(Listing.seller).selectinload(User.showrooms),
            selectinload(Listing.published_revision).selectinload(ListingRevision.media),
            selectinload(Listing.published_revision).selectinload(ListingRevision.brand),
            selectinload(Listing.published_revision).selectinload(ListingRevision.model),
            selectinload(Listing.published_revision).selectinload(ListingRevision.variant),
            selectinload(Listing.revisions).selectinload(ListingRevision.media),
            selectinload(Listing.revisions).selectinload(ListingRevision.brand),
            selectinload(Listing.revisions).selectinload(ListingRevision.model),
            selectinload(Listing.revisions).selectinload(ListingRevision.variant),
        ]

        stmt = (
            select(Listing)
            .options(*load_options)
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
            model_id=revision.model_id,
            model_name=revision.model.name if revision.model else None,
            variant_id=revision.variant_id,
            variant_name=revision.variant.name if revision.variant else None,
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

