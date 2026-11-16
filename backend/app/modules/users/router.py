import uuid
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict
from fastapi import APIRouter, Depends
from sqlalchemy import select, func, desc, or_
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.user import User
from app.models.showroom import Showroom
from app.models.listing import Listing, ListingRevision, ListingMedia
from app.models.review import Review
from app.modules.listings.schemas import ListingListItemResponse
from app.modules.auth.schemas import ShowroomBriefResponse
from app.shared.exceptions import NotFoundException

router = APIRouter(prefix="/users", tags=["Users"])


class PublicSellerProfileResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    display_name: str
    avatar_url: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    province_code: Optional[str] = None
    province_name: Optional[str] = None
    account_type: str = "INDIVIDUAL"
    created_at: datetime
    rating_avg: float = 5.0
    reviews_count: int = 0
    active_listings_count: int = 0
    sold_listings_count: int = 0
    showroom: Optional[ShowroomBriefResponse] = None
    active_listings: List[ListingListItemResponse] = []


@router.get("/{user_id}/public", response_model=PublicSellerProfileResponse)
async def get_public_seller_profile(
    user_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    """Lấy thông tin hồ sơ người bán công khai (uy tín, đánh giá, danh sách xe đang bán)."""
    # 1. Tìm thông tin người dùng theo user_id, nếu không thấy thử tìm theo Showroom.id
    user_stmt = select(User).where(User.id == user_id, User.status == "ACTIVE")
    res = await db.execute(user_stmt)
    user = res.scalar_one_or_none()
    
    sr = None
    if not user:
        sr_fallback_stmt = select(Showroom).where(Showroom.id == user_id)
        sr_fallback_res = await db.execute(sr_fallback_stmt)
        sr = sr_fallback_res.scalar_one_or_none()
        if sr:
            user_stmt2 = select(User).where(User.id == sr.owner_user_id, User.status == "ACTIVE")
            user = (await db.execute(user_stmt2)).scalar_one_or_none()

    if not user:
        raise NotFoundException("Người bán hoặc Showroom không tồn tại hoặc tài khoản không hoạt động")

    # 2. Tìm Showroom liên kết (nếu chưa tìm ở bước trên)
    if not sr:
        sr_stmt = select(Showroom).where(Showroom.owner_user_id == user.id)
        sr_res = await db.execute(sr_stmt)
        sr = sr_res.scalar_one_or_none()

    sr_brief = None
    account_type = "INDIVIDUAL"
    if sr:
        account_type = "SHOWROOM"
        sr_brief = ShowroomBriefResponse(
            id=sr.id,
            name=sr.name,
            phone=sr.phone or user.phone,
            address=sr.address or user.address,
            province_code=sr.province_code or user.province_code,
            description=sr.description,
            logo_url=sr.logo_url,
            banner_url=sr.banner_url,
            is_verified=sr.is_verified,
            created_at=sr.created_at,
        )

    # 3. Thống kê đánh giá uy tín (Review)
    rev_stmt = select(
        func.coalesce(func.avg(Review.rating), 5.0),
        func.count(Review.id),
    ).where(Review.seller_user_id == user.id, Review.status == "VISIBLE")
    rev_res = await db.execute(rev_stmt)
    rating_avg, reviews_count = rev_res.one()

    # 4. Thống kê số lượng tin đăng
    where_clause = or_(Listing.seller_user_id == user.id, Listing.showroom_id == sr.id) if sr else (Listing.seller_user_id == user.id)
    active_cnt_stmt = select(func.count(Listing.id)).where(where_clause, Listing.status == "PUBLISHED")
    active_cnt = (await db.execute(active_cnt_stmt)).scalar() or 0

    sold_cnt_stmt = select(func.count(Listing.id)).where(where_clause, Listing.status == "SOLD")
    sold_cnt = (await db.execute(sold_cnt_stmt)).scalar() or 0

    # 5. Danh sách xe đang mở bán công khai
    listings_stmt = (
        select(Listing)
        .options(
            selectinload(Listing.published_revision).selectinload(ListingRevision.media),
            selectinload(Listing.showroom),
        )
        .where(where_clause, Listing.status == "PUBLISHED")
        .order_by(desc(Listing.is_featured), desc(Listing.published_at))
        .limit(100)
    )
    listings_res = await db.execute(listings_stmt)
    listings = listings_res.scalars().all()

    active_items = []
    for l in listings:
        rev = l.published_revision
        if rev:
            primary_img = None
            if rev.media:
                primary_media = next((m for m in rev.media if m.is_primary), rev.media[0])
                primary_img = primary_media.url

            active_items.append(
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
                    province_name=user.province_name or rev.province_code,
                    location_address=rev.location_address,
                    primary_image_url=primary_img,
                    seller_id=user.id,
                    seller_name=user.display_name,
                    seller_type=account_type,
                    showroom_id=sr.id if sr else None,
                    showroom_name=sr.name if sr else None,
                    is_showroom_verified=sr.is_verified if sr else False,
                    is_featured=bool(l.is_featured),
                    featured_tier=l.featured_tier,
                    views_count=l.views_count,
                    favorites_count=l.favorites_count,
                    published_at=l.published_at,
                    created_at=l.created_at,
                )
            )

    return PublicSellerProfileResponse(
        id=user.id,
        display_name=user.display_name,
        avatar_url=user.avatar_url,
        phone=user.phone,
        email=user.email,
        address=user.address,
        province_code=user.province_code,
        province_name=user.province_name,
        account_type=account_type,
        created_at=user.created_at,
        rating_avg=round(float(rating_avg), 1),
        reviews_count=reviews_count,
        active_listings_count=active_cnt,
        sold_listings_count=sold_cnt,
        showroom=sr_brief,
        active_listings=active_items,
    )
