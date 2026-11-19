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
from app.core.cache import fast_cache
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
    background_tasks: BackgroundTasks,
    submit_now: bool = Query(True, description="Tự động gửi duyệt ngay sau khi đăng tin"),
    current_user: User = Depends(get_current_verified_user),
    db: AsyncSession = Depends(get_db),
):
    service = ListingService(db)
    listing = await service.create_draft(current_user, data)
    if submit_now:
        listing = await service.submit_for_review(listing.id, current_user, background_tasks=background_tasks)
    await fast_cache.invalidate_prefix("listings:")

    if listing.status == "PUBLISHED":
        msg = "Đăng tin xe thành công! Tin đã được hệ thống tự động phê duyệt và xuất bản trực tiếp lên sàn AuraAuto."
    elif submit_now:
        msg = "Đăng tin xe thành công! Hồ sơ đã được gửi tới Ban Quản Trị để phê duyệt xuất bản."
    else:
        msg = "Đã lưu bản nháp tin đăng xe thành công."

    return SuccessResponse(
        message=msg,
        data={"id": str(listing.id), "status": listing.status},
    )


@router.get("", response_model=PaginatedResponse[ListingListItemResponse])
async def list_listings(
    brand_id: Optional[uuid.UUID] = None,
    brand: Optional[str] = None,
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
    # Cache cho các truy vấn phổ biến mặc định (homepage / trang khám phá xe)
    is_default_query = (
        not any([
            brand_id, brand, model_id, min_price_vnd, max_price_vnd, min_year, max_year,
            max_km, body_type, fuel_type, transmission, province_code, search,
        ])
        and sort_by == "newest"
        and page == 1
    )
    cache_key = f"listings:default:{page}:{page_size}" if is_default_query else None
    if cache_key:
        cached = await fast_cache.get(cache_key)
        if cached is not None:
            return cached

    params = ListingFilterParams(
        brand_id=brand_id,
        brand=brand,
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

    response = PaginatedResponse(
        items=items,
        pagination=PaginationMeta(
            page=page,
            page_size=page_size,
            total=total,
            total_pages=total_pages,
        ),
    )
    if cache_key:
        await fast_cache.set(cache_key, response, ttl_seconds=30)
    return response


@router.get("/me/summary", response_model=MyListingsSummaryResponse)
async def get_my_listings_summary(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Thống kê tổng quan về các tin đăng của người dùng hiện tại
    (Tổng tin, tin đang bán, chờ duyệt, đã bán, bị từ chối, tin VIP, tổng lượt xem, tổng yêu thích).
    """
    service = ListingService(db)
    return await service.get_my_listings_summary(current_user)


@router.get("/me/my-listings", response_model=PaginatedResponse[ListingListItemResponse])
async def get_my_listings(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status_filter: Optional[str] = Query(None, description="ALL, PUBLISHED, PENDING_REVIEW, DRAFT, SOLD, REJECTED, HIDDEN"),
    search: Optional[str] = Query(None, description="Tìm kiếm theo tiêu đề xe"),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    service = ListingService(db)
    return await service.get_my_listings(
        current_user=current_user,
        page=page,
        page_size=page_size,
        status_filter=status_filter,
        search=search,
    )


@router.get("/featured", response_model=List[ListingListItemResponse])
async def get_featured_listings(
    limit: int = Query(6, ge=1, le=24),
    db: AsyncSession = Depends(get_db),
):
    """Lấy danh sách các tin xe nổi bật ưu tiên hiển thị trên trang chủ (Fast Cached)."""
    cache_key = f"listings:featured:{limit}"
    cached = await fast_cache.get(cache_key)
    if cached is not None:
        return cached

    service = ListingService(db)
    items = await service.get_featured_quick(limit=limit)
    await fast_cache.set(cache_key, items, ttl_seconds=60)
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
    background_tasks.add_task(_increment_listing_views, id)

    # Fast Cache cho người dùng xem công khai (30 giây)
    cache_key = f"listings:detail:{id}" if not current_user else None
    if cache_key:
        cached = await fast_cache.get(cache_key)
        if cached is not None:
            return cached

    service = ListingService(db)
    detail = await service.get_listing_detail(id, current_user=current_user)
    if cache_key:
        await fast_cache.set(cache_key, detail, ttl_seconds=30)
    return detail


@router.post("/{id}/submit", response_model=SuccessResponse)
async def submit_listing_for_review(
    id: uuid.UUID,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_verified_user),
    db: AsyncSession = Depends(get_db),
):
    service = ListingService(db)
    listing = await service.submit_for_review(id, current_user, background_tasks=background_tasks)
    if listing.status == "PUBLISHED":
        msg = "Tin đã được hệ thống phê duyệt tự động và xuất bản trực tiếp lên sàn AuraAuto thành công!"
    else:
        msg = "Gửi duyệt tin thành công! Tin của bạn sẽ được Ban Quản Trị xét duyệt."
    return SuccessResponse(
        message=msg,
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
    await fast_cache.invalidate_prefix("listings:")
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
    await fast_cache.invalidate_prefix("listings:")
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
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Cập nhật toàn diện tin đăng xe:
    - Nếu là Admin/Nhân sự quản trị: Tin và bản sửa đổi mới được tự động duyệt và xuất bản trực tiếp ngay lập tức.
    - Nếu là người dùng thông thường:
      + Nếu tin đang PUBLISHED: Bản sửa đổi mới sẽ được gửi duyệt (PENDING), trong lúc đó tin công khai trên sàn vẫn giữ nguyên dữ liệu cũ.
      + Nếu tin đang DRAFT/REJECTED: Tin sẽ chuyển sang PENDING_REVIEW để admin thẩm định lần đầu.
    """
    service = ListingService(db)
    listing, rev = await service.update_listing(id, data, current_user, background_tasks=background_tasks)
    await fast_cache.invalidate_prefix("listings:")

    if listing.status == "PUBLISHED" and rev.review_status == "APPROVED":
        msg = f"Đã cập nhật và xuất bản trực tiếp tin đăng xe (Phiên bản #{rev.revision_no}) thành công!"
    else:
        msg = "Đã lưu và gửi bản chỉnh sửa tin đăng xe thành công! Bản tin đang được chuyển tới Ban Quản Trị phê duyệt."

    return SuccessResponse(
        message=msg,
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

    # Bảo vệ quy trình kiểm duyệt: Tin đã PUBLISHED không cho phép thay đổi tiêu đề hoặc địa chỉ trực tiếp mà không qua xét duyệt
    is_staff = current_user.role in ("ADMIN", "INSPECTOR", "SUPPORT")
    if listing.status == "PUBLISHED" and not is_staff:
        title_changed = data.title is not None and data.title.strip() != rev.title
        address_changed = data.location_address is not None and data.location_address.strip() != (rev.location_address or "")
        if title_changed or address_changed:
            raise HTTPException(
                status_code=400,
                detail="Tin xe đã xuất bản. Để thay đổi tiêu đề hoặc địa chỉ, vui lòng sử dụng chức năng 'Chỉnh sửa toàn diện' để kiểm định viên phê duyệt trước khi công khai.",
            )

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
    await fast_cache.invalidate_prefix("listings:")
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

