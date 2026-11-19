import uuid
import math
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
    MyListingsSummaryResponse,
)
from app.shared.exceptions import NotFoundException, ForbiddenException, ConflictException, AppException
from app.shared.schemas import PaginatedResponse, PaginationMeta



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
        seen_ids = set()
        for listing, rev, seller, sr, primary_img in rows:
            if listing.id in seen_ids:
                continue
            seen_ids.add(listing.id)
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
        seen_ids = set()
        for listing, rev, seller, sr, primary_img in rows:
            if listing.id in seen_ids:
                continue
            seen_ids.add(listing.id)
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

    async def get_my_listings_summary(self, current_user: User) -> MyListingsSummaryResponse:
        """Thống kê tổng quan về các tin đăng của người dùng hiện tại."""
        now_utc = datetime.now(timezone.utc)
        summary_stmt = select(
            func.count(Listing.id).filter(Listing.status != "REMOVED").label("total"),
            func.count(Listing.id).filter(Listing.status == "PUBLISHED").label("published"),
            func.count(Listing.id).filter(Listing.status == "PENDING_REVIEW").label("pending"),
            func.count(Listing.id).filter(Listing.status == "SOLD").label("sold"),
            func.count(Listing.id).filter(Listing.status == "REJECTED").label("rejected"),
            func.count(Listing.id).filter(Listing.status == "DRAFT").label("draft"),
            func.count(Listing.id).filter(Listing.status == "HIDDEN").label("hidden"),
            func.count(Listing.id).filter(
                Listing.is_featured == True,
                Listing.featured_until > now_utc,
                Listing.status != "REMOVED",
            ).label("featured"),
            func.coalesce(func.sum(case((Listing.status != "REMOVED", Listing.views_count), else_=0)), 0).label("views"),
            func.coalesce(func.sum(case((Listing.status != "REMOVED", Listing.favorites_count), else_=0)), 0).label("favs"),
        ).where(Listing.seller_user_id == current_user.id)
        row = (await self.db.execute(summary_stmt)).one()

        return MyListingsSummaryResponse(
            total_listings=int(row.total or 0),
            published_listings=int(row.published or 0),
            pending_listings=int(row.pending or 0),
            sold_listings=int(row.sold or 0),
            rejected_listings=int(row.rejected or 0),
            draft_listings=int(row.draft or 0),
            hidden_listings=int(row.hidden or 0),
            featured_listings=int(row.featured or 0),
            total_views=int(row.views or 0),
            total_favorites=int(row.favs or 0),
        )

    async def get_my_listings(
        self,
        current_user: User,
        page: int = 1,
        page_size: int = 20,
        status_filter: Optional[str] = None,
        search: Optional[str] = None,
    ) -> PaginatedResponse[ListingListItemResponse]:
        """Truy vấn danh sách tin đăng thuộc quyền sở hữu của người dùng hiện tại (hỗ trợ phân trang, lọc status, search)."""
        query = (
            select(Listing)
            .options(
                selectinload(Listing.revisions).selectinload(ListingRevision.media),
                selectinload(Listing.showroom),
            )
            .where(Listing.seller_user_id == current_user.id)
        )

        if status_filter and status_filter.upper() != "ALL":
            query = query.where(Listing.status == status_filter.upper())
        else:
            query = query.where(Listing.status != "REMOVED")

        if search and search.strip():
            kw = f"%{search.strip()}%"
            query = query.join(Listing.revisions).where(ListingRevision.title.ilike(kw)).distinct()

        count_query = (
            select(func.count(func.distinct(Listing.id)))
            .select_from(Listing)
            .where(Listing.seller_user_id == current_user.id)
        )
        if status_filter and status_filter.upper() != "ALL":
            count_query = count_query.where(Listing.status == status_filter.upper())
        else:
            count_query = count_query.where(Listing.status != "REMOVED")

        if search and search.strip():
            kw = f"%{search.strip()}%"
            count_query = count_query.join(Listing.revisions).where(ListingRevision.title.ilike(kw))

        total = (await self.db.execute(count_query)).scalar() or 0

        stmt = query.order_by(Listing.created_at.desc()).offset((page - 1) * page_size).limit(page_size)
        res = await self.db.execute(stmt)
        listings = res.scalars().all()

        items: List[ListingListItemResponse] = []
        now_utc = datetime.now(timezone.utc)
        for l in listings:
            rev = max(l.revisions, key=lambda r: r.revision_no) if l.revisions else None
            if rev:
                primary_img = None
                if rev.media:
                    primary_media = next((m for m in rev.media if m.is_primary), rev.media[0])
                    primary_img = primary_media.url

                sr = l.showroom
                is_sr = l.showroom_id is not None or (sr is not None)
                is_feat = bool(l.is_featured and l.featured_until and l.featured_until > now_utc)

                rej_reason = rev.rejection_reason if (l.status == "REJECTED" or getattr(rev, "review_status", None) == "REJECTED") else None
                has_pending = bool(
                    l.published_revision_id
                    and rev.review_status == "PENDING"
                    and l.published_revision_id != rev.id
                )

                items.append(
                    ListingListItemResponse(
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
                        location_address=rev.location_address,
                        primary_image_url=primary_img,
                        seller_id=current_user.id,
                        seller_name=current_user.display_name,
                        seller_type="SHOWROOM" if is_sr else "INDIVIDUAL",
                        showroom_id=l.showroom_id,
                        showroom_name=sr.name if sr else None,
                        is_showroom_verified=sr.is_verified if sr else False,
                        is_featured=is_feat,
                        featured_until=l.featured_until,
                        featured_tier=l.featured_tier,
                        views_count=l.views_count or 0,
                        favorites_count=l.favorites_count or 0,
                        contacts_count=l.contacts_count or 0,
                        rejection_reason=rej_reason,
                        has_pending_revision=has_pending,
                        pending_revision_no=rev.revision_no if has_pending else None,
                        review_status=rev.review_status,
                        published_at=l.published_at,
                        created_at=l.created_at,
                    )
                )

        total_pages = math.ceil(total / page_size) if total > 0 else 0
        return PaginatedResponse(
            items=items,
            pagination=PaginationMeta(
                page=page,
                page_size=page_size,
                total=total,
                total_pages=total_pages,
            ),
        )

