import uuid
import math
from datetime import datetime, timezone
from typing import Optional, List
from pydantic import BaseModel, Field
from fastapi import APIRouter, Depends, Query, UploadFile, File, status, BackgroundTasks, HTTPException
from sqlalchemy import select, update, func, delete, case
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db, AsyncSessionLocal
from app.core.deps import get_current_active_user, get_current_verified_user, get_optional_user
from app.models.user import User
from app.models.listing import Listing, ListingRevision
from app.modules.listings.schemas import (
    CreateListingRequest,
    UpdateListingRequest,
    ListingListItemResponse,
    ListingDetailResponse,
    ListingFilterParams,
    MyListingsSummaryResponse,
    QuickUpdateListingRequest,
)
from app.modules.listings.service import ListingService
from app.modules.media.service import media_service
from app.shared.schemas import PaginatedResponse, PaginationMeta, SuccessResponse

router = APIRouter(prefix="/listings", tags=["Listings"])


@router.post("", response_model=SuccessResponse, status_code=status.HTTP_201_CREATED)
async def create_draft_listing(
    data: CreateListingRequest,
    submit_now: bool = Query(True, description="Tự động gửi duyệt ngay sau khi đăng tin"),
    current_user: User = Depends(get_current_verified_user),
    db: AsyncSession = Depends(get_db),
):
    service = ListingService(db)
    listing = await service.create_draft(current_user, data)
    if submit_now:
        listing = await service.submit_for_review(listing.id, current_user)
    return SuccessResponse(
        message="Đăng tin xe thành công! Hồ sơ đã được gửi tới Ban Quản Trị để phê duyệt xuất bản.",
        data={"id": str(listing.id), "status": listing.status},
    )


@router.get("", response_model=PaginatedResponse[ListingListItemResponse])
async def list_listings(
    brand_id: Optional[uuid.UUID] = None,
    model_id: Optional[uuid.UUID] = None,
    min_price_vnd: Optional[int] = Query(None, ge=0),
    max_price_vnd: Optional[int] = Query(None, ge=0),
    min_year: Optional[int] = Query(None, ge=1990),
    max_year: Optional[int] = Query(None, le=2027),
    max_km: Optional[int] = Query(None, ge=0),
    body_type: Optional[str] = None,
    fuel_type: Optional[str] = None,
    transmission: Optional[str] = None,
    province_code: Optional[str] = None,
    search: Optional[str] = None,
    sort_by: Optional[str] = "newest",
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    params = ListingFilterParams(
        brand_id=brand_id,
        model_id=model_id,
        min_price_vnd=min_price_vnd,
        max_price_vnd=max_price_vnd,
        min_year=min_year,
        max_year=max_year,
        max_km=max_km,
        body_type=body_type,
        fuel_type=fuel_type,
        transmission=transmission,
        province_code=province_code,
        search=search,
        sort_by=sort_by,
    )
    service = ListingService(db)
    items, total = await service.get_public_listings(params, page, page_size)
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


@router.get("/me/summary", response_model=MyListingsSummaryResponse)
async def get_my_listings_summary(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Thống kê tổng quan về các tin đăng của người dùng hiện tại
    (Tổng tin, tin đang bán, chờ duyệt, đã bán, bị từ chối, tin VIP, tổng lượt xem, tổng yêu thích).
    """
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
    row = (await db.execute(summary_stmt)).one()

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


@router.get("/me/my-listings", response_model=PaginatedResponse[ListingListItemResponse])
async def get_my_listings(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status_filter: Optional[str] = Query(None, description="ALL, PUBLISHED, PENDING_REVIEW, DRAFT, SOLD, REJECTED, HIDDEN"),
    search: Optional[str] = Query(None, description="Tìm kiếm theo tiêu đề xe"),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
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

    total = (await db.execute(count_query)).scalar() or 0

    stmt = query.order_by(Listing.created_at.desc()).offset((page - 1) * page_size).limit(page_size)
    res = await db.execute(stmt)
    listings = res.scalars().all()

    items = []
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


@router.get("/featured", response_model=List[ListingListItemResponse])
async def get_featured_listings(
    limit: int = Query(6, ge=1, le=24),
    db: AsyncSession = Depends(get_db),
):
    """Lấy danh sách các tin xe nổi bật ưu tiên hiển thị trên trang chủ."""
    service = ListingService(db)
    params = ListingFilterParams(is_featured=True, sort_by="newest")
    items, _ = await service.get_public_listings(params=params, page=1, page_size=limit)
    return items


class CompareRequest(BaseModel):
    listing_ids: List[uuid.UUID] = Field(min_length=2, max_length=4)


@router.post("/compare", response_model=List[ListingDetailResponse])
async def compare_listings(
    data: CompareRequest,
    db: AsyncSession = Depends(get_db),
):
    service = ListingService(db)
    results = []
    for lid in data.listing_ids:
        try:
            detail = await service.get_listing_detail(lid)
            results.append(detail)
        except Exception:
            continue
    return results


async def _increment_listing_views(listing_id: uuid.UUID):
    """Background task to increment view count without blocking read request."""
    try:
        async with AsyncSessionLocal() as session:
            await session.execute(
                update(Listing).where(Listing.id == listing_id).values(views_count=Listing.views_count + 1)
            )
            await session.commit()
    except Exception:
        pass


@router.get("/{id}", response_model=ListingDetailResponse)
async def get_listing(
    id: uuid.UUID,
    background_tasks: BackgroundTasks,
    current_user: Optional[User] = Depends(get_optional_user),
    db: AsyncSession = Depends(get_db),
):
    service = ListingService(db)
    detail = await service.get_listing_detail(id, current_user)
    background_tasks.add_task(_increment_listing_views, id)
    return detail


@router.post("/{id}/submit", response_model=SuccessResponse)
async def submit_listing_for_review(
    id: uuid.UUID,
    current_user: User = Depends(get_current_verified_user),
    db: AsyncSession = Depends(get_db),
):
    service = ListingService(db)
    listing = await service.submit_for_review(id, current_user)
    return SuccessResponse(
        message="Gửi duyệt tin thành công! Tin của bạn sẽ được Admin xét duyệt.",
        data={"id": str(listing.id), "status": listing.status},
    )


@router.post("/{id}/mark-sold", response_model=SuccessResponse)
async def mark_listing_sold(
    id: uuid.UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    service = ListingService(db)
    listing = await service.mark_sold(id, current_user)
    return SuccessResponse(
        message="Đánh dấu đã bán thành công! Mọi lịch xem xe chưa diễn ra đã được hủy tự động.",
        data={"id": str(listing.id), "status": listing.status},
    )


@router.post("/{id}/media", response_model=SuccessResponse)
async def upload_and_attach_media(
    id: uuid.UUID,
    files: List[UploadFile] = File(...),
    current_user: User = Depends(get_current_verified_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Tải trực tiếp nhiều ảnh (nhiều góc chụp) cho tin đăng xe lên Cloudinary
    và tự động liên kết vào bản sửa đổi (revision) của tin.
    """
    service = ListingService(db)
    media_items = []
    for idx, f in enumerate(files):
        f_bytes = await f.read()
        up_res = await media_service.upload_media(
            file_bytes=f_bytes,
            filename=f.filename or f"car_photo_{idx}.jpg",
            folder="used_cars_listings",
        )
        media_items.append({
            "url": up_res.secure_url,
            "media_type": "IMAGE",
            "is_primary": (idx == 0),
            "sort_order": idx,
        })

    saved = await service.add_media_items(id, current_user, media_items)
    return SuccessResponse(
        message=f"Đã tải lên và đính kèm {len(saved)} ảnh xe thành công!",
        data=[{"id": str(m.id), "url": m.url, "is_primary": m.is_primary} for m in saved],
    )


@router.post("/{id}/toggle-hide", response_model=SuccessResponse)
async def toggle_hide_listing(
    id: uuid.UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Tạm ẩn tin đăng hoặc bỏ ẩn tin đăng của người bán.
    """
    res = await db.execute(select(Listing).where(Listing.id == id))
    listing = res.scalar_one_or_none()
    if not listing:
        raise HTTPException(status_code=404, detail="Không tìm thấy tin đăng")
    if listing.seller_user_id != current_user.id and current_user.role != "ADMIN":
        raise HTTPException(status_code=403, detail="Bạn không có quyền thao tác trên tin đăng này")

    if listing.status == "PUBLISHED":
        listing.status = "HIDDEN"
        msg = "Đã tạm ẩn tin đăng xe thành công! Tin sẽ tạm thời không xuất hiện trên sàn."
    elif listing.status == "HIDDEN":
        listing.status = "PUBLISHED"
        msg = "Đã hiển thị lại tin đăng xe trên sàn thành công!"
    else:
        raise HTTPException(status_code=400, detail="Chỉ có thể ẩn/hiện tin đăng đang ở trạng thái Hoạt động hoặc Đang ẩn")

    await db.commit()
    return SuccessResponse(message=msg, data={"id": str(listing.id), "status": listing.status})


@router.post("/{id}/relist", response_model=SuccessResponse)
async def relist_listing(
    id: uuid.UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Mở bán lại tin xe (khi giao dịch cũ bị hủy hoặc xe đã bán muốn mở lại).
    """
    res = await db.execute(select(Listing).where(Listing.id == id))
    listing = res.scalar_one_or_none()
    if not listing:
        raise HTTPException(status_code=404, detail="Không tìm thấy tin đăng")
    if listing.seller_user_id != current_user.id and current_user.role != "ADMIN":
        raise HTTPException(status_code=403, detail="Bạn không có quyền thao tác trên tin đăng này")

    if listing.status not in ["SOLD", "HIDDEN", "REMOVED"]:
        raise HTTPException(status_code=400, detail="Chỉ có thể mở bán lại tin xe đã bán hoặc đang tạm ẩn")

    listing.status = "PUBLISHED"
    listing.sold_at = None
    await db.commit()
    return SuccessResponse(
        message="Mở bán lại tin đăng xe thành công! Khách hàng có thể tìm kiếm và liên hệ ngay.",
        data={"id": str(listing.id), "status": listing.status},
    )


@router.delete("/{id}", response_model=SuccessResponse)
async def delete_listing(
    id: uuid.UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Xóa tin đăng xe của người bán.
    - Bản nháp (DRAFT) hoặc bị từ chối (REJECTED): Xóa hoàn toàn.
    - Tin đã từng công khai: Chuyển trạng thái sang REMOVED để bảo toàn lịch sử giao dịch.
    """
    res = await db.execute(select(Listing).where(Listing.id == id))
    listing = res.scalar_one_or_none()
    if not listing:
        raise HTTPException(status_code=404, detail="Không tìm thấy tin đăng")
    if listing.seller_user_id != current_user.id and current_user.role != "ADMIN":
        raise HTTPException(status_code=403, detail="Bạn không có quyền xóa tin đăng này")

    if listing.status in ["DRAFT", "REJECTED"]:
        await db.delete(listing)
    else:
        listing.status = "REMOVED"
        listing.is_featured = False

    await db.commit()
    return SuccessResponse(message="Đã xóa tin đăng xe thành công!", data={"id": str(id)})


@router.get("/{id}/editable", response_model=SuccessResponse)
async def get_editable_listing(
    id: uuid.UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Lấy toàn bộ thông tin chi tiết của tin đăng (phiên bản mới nhất) để đưa vào form chỉnh sửa.
    """
    service = ListingService(db)
    data = await service.get_editable_listing(id, current_user)
    return SuccessResponse(message="Lấy dữ liệu chỉnh sửa thành công", data=data)


@router.put("/{id}", response_model=SuccessResponse)
async def update_listing(
    id: uuid.UUID,
    data: UpdateListingRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Cập nhật toàn diện tin đăng xe:
    - Nếu tin đang PUBLISHED: Bản sửa đổi mới sẽ được gửi duyệt (PENDING), trong lúc đó tin công khai trên sàn vẫn giữ nguyên dữ liệu cũ.
    - Nếu tin đang DRAFT/REJECTED: Tin sẽ chuyển sang PENDING_REVIEW để admin thẩm định lần đầu.
    """
    service = ListingService(db)
    listing, rev = await service.update_listing(id, data, current_user)
    return SuccessResponse(
        message="Đã lưu và gửi bản chỉnh sửa tin đăng xe thành công! Bản tin đang được chuyển tới Ban Quản Trị phê duyệt.",
        data={
            "id": str(listing.id),
            "status": listing.status,
            "revision_no": rev.revision_no,
            "review_status": rev.review_status,
        },
    )


@router.patch("/{id}/quick-update", response_model=SuccessResponse)
async def quick_update_listing(
    id: uuid.UUID,
    data: QuickUpdateListingRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Cập nhật nhanh giá bán hoặc tiêu đề tin đăng mà không cần tạo lại tin từ đầu.
    """
    res = await db.execute(
        select(Listing)
        .options(selectinload(Listing.revisions))
        .where(Listing.id == id)
    )
    listing = res.scalar_one_or_none()
    if not listing:
        raise HTTPException(status_code=404, detail="Không tìm thấy tin đăng")
    if listing.seller_user_id != current_user.id and current_user.role != "ADMIN":
        raise HTTPException(status_code=403, detail="Bạn không có quyền cập nhật tin đăng này")

    rev = max(listing.revisions, key=lambda r: r.revision_no) if listing.revisions else None
    if not rev:
        raise HTTPException(status_code=400, detail="Tin đăng chưa có bản sửa đổi nào")

    updated_fields = []
    if data.price_vnd is not None:
        rev.price_vnd = data.price_vnd
        updated_fields.append("giá bán")
    if data.title is not None and data.title.strip():
        rev.title = data.title.strip()
        updated_fields.append("tiêu đề")
    if data.location_address is not None:
        rev.location_address = data.location_address.strip()
        updated_fields.append("địa chỉ")

    await db.commit()
    fields_str = ", ".join(updated_fields) if updated_fields else "thông tin"
    return SuccessResponse(
        message=f"Đã cập nhật {fields_str} thành công!",
        data={
            "id": str(listing.id),
            "title": rev.title,
            "price_vnd": rev.price_vnd,
            "location_address": rev.location_address,
        },
    )

