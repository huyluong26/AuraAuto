import uuid
from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_active_user
from app.models.user import User
from app.models.listing import Listing, ListingRevision
from app.models.favorite import Favorite
from app.modules.listings.schemas import ListingListItemResponse
from app.shared.exceptions import NotFoundException, ConflictException
from app.shared.schemas import SuccessResponse

router = APIRouter(prefix="/me/favorites", tags=["Favorites"])


@router.post("/{listing_id}", response_model=SuccessResponse, status_code=status.HTTP_201_CREATED)
async def add_favorite(
    listing_id: uuid.UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(Listing).where(Listing.id == listing_id)
    res = await db.execute(stmt)
    listing = res.scalar_one_or_none()
    if not listing:
        raise NotFoundException("Tin đăng không tồn tại")

    fav_stmt = select(Favorite).where(
        Favorite.user_id == current_user.id,
        Favorite.listing_id == listing_id,
    )
    fav_res = await db.execute(fav_stmt)
    if fav_res.scalar_one_or_none():
        raise ConflictException("Bạn đã lưu tin này vào danh sách yêu thích rồi")

    fav = Favorite(user_id=current_user.id, listing_id=listing_id)
    db.add(fav)
    listing.favorites_count += 1
    await db.commit()

    return SuccessResponse(message="Đã lưu tin đăng vào danh sách yêu thích")


@router.delete("/{listing_id}", response_model=SuccessResponse)
async def remove_favorite(
    listing_id: uuid.UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    fav_stmt = select(Favorite).where(
        Favorite.user_id == current_user.id,
        Favorite.listing_id == listing_id,
    )
    fav_res = await db.execute(fav_stmt)
    fav = fav_res.scalar_one_or_none()
    if not fav:
        raise NotFoundException("Tin này không có trong danh sách yêu thích của bạn")

    await db.delete(fav)

    listing_stmt = select(Listing).where(Listing.id == listing_id)
    l_res = await db.execute(listing_stmt)
    listing = l_res.scalar_one_or_none()
    if listing and listing.favorites_count > 0:
        listing.favorites_count -= 1

    await db.commit()
    return SuccessResponse(message="Đã xóa khỏi danh sách yêu thích")


@router.get("", response_model=List[ListingListItemResponse])
async def list_favorites(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    stmt = (
        select(Favorite, Listing, ListingRevision, User)
        .join(Listing, Favorite.listing_id == Listing.id)
        .join(ListingRevision, Listing.published_revision_id == ListingRevision.id)
        .join(User, Listing.seller_user_id == User.id)
        .where(Favorite.user_id == current_user.id)
        .order_by(Favorite.created_at.desc())
    )
    res = await db.execute(stmt)
    rows = res.all()

    items = []
    for _, listing, rev, seller in rows:
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
                primary_image_url=None,
                seller_id=seller.id,
                seller_name=seller.display_name,
                published_at=listing.published_at,
                created_at=listing.created_at,
            )
        )
    return items
