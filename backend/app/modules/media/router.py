from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, status
from typing import Optional, List
from sqlalchemy import select, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_active_user
from app.models.user import User
from app.models.listing import Listing, ListingRevision, ListingMedia
from app.models.showroom import Showroom
from app.modules.media.schemas import (
    MediaUploadResponse,
    MediaSignUploadRequest,
    MediaSignUploadResponse,
    MediaDeleteResponse,
)
from app.modules.media.service import media_service
from app.shared.exceptions import ValidationException, ForbiddenException

router = APIRouter(prefix="/media", tags=["Media"])

ALLOWED_MIME_TYPES = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/jpg",
    "video/mp4",
    "video/quicktime",
]
MAX_FILE_SIZE = 25 * 1024 * 1024  # 25 MB


@router.post("/upload", response_model=MediaUploadResponse)
async def upload_media_file(
    file: UploadFile = File(...),
    folder: Optional[str] = Form("used_cars"),
    current_user: User = Depends(get_current_active_user),
):
    """
    Tải file ảnh hoặc video lên Cloudinary (hoặc local fallback).
    Yêu cầu người dùng đã đăng nhập (Người bán, Showroom hoặc Admin).
    """
    if file.content_type not in ALLOWED_MIME_TYPES:
        raise ValidationException(
            f"Định dạng '{file.content_type}' không được hỗ trợ. Vui lòng tải lên ảnh (JPEG, PNG, WEBP) hoặc video MP4."
        )

    file_bytes = await file.read()
    if len(file_bytes) > MAX_FILE_SIZE:
        raise ValidationException("Dung lượng file vượt quá giới hạn tối đa 25MB.")

    return await media_service.upload_media(
        file_bytes=file_bytes,
        filename=file.filename or "uploaded_media.jpg",
        folder=folder or "used_cars",
    )


@router.post("/upload-multiple", response_model=List[MediaUploadResponse])
async def upload_multiple_media_files(
    files: List[UploadFile] = File(...),
    folder: Optional[str] = Form("used_cars"),
    current_user: User = Depends(get_current_active_user),
):
    """
    Tải đồng thời NHIỀU file ảnh/video lên Cloudinary (phục vụ đăng tin bán xe có nhiều góc chụp).
    """
    if not files:
        raise ValidationException("Vui lòng tải lên ít nhất 1 file.")

    uploaded_items = []
    for f in files:
        if f.content_type not in ALLOWED_MIME_TYPES:
            raise ValidationException(
                f"Định dạng '{f.content_type}' của file '{f.filename}' không được hỗ trợ."
            )

        f_bytes = await f.read()
        if len(f_bytes) > MAX_FILE_SIZE:
            raise ValidationException(f"Dung lượng file '{f.filename}' vượt quá giới hạn 25MB.")

        item = await media_service.upload_media(
            file_bytes=f_bytes,
            filename=f.filename or "uploaded_media.jpg",
            folder=folder or "used_cars",
        )
        uploaded_items.append(item)

    return uploaded_items


@router.post("/sign-upload", response_model=MediaSignUploadResponse)
async def sign_cloudinary_upload(
    data: MediaSignUploadRequest,
    current_user: User = Depends(get_current_active_user),
):
    """
    Chứng thực upload Cloudinary theo chính sách (API Contract dòng 38).
    Trả về timestamp, signature, api_key và cloud_name để frontend tải trực tiếp lên Cloudinary.
    """
    return media_service.generate_upload_signature(folder=data.folder)


@router.delete("/{public_id:path}", response_model=MediaDeleteResponse)
async def delete_media_file(
    public_id: str,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Xóa file ảnh hoặc video trên Cloudinary theo public_id.
    Yêu cầu quyền sở hữu hoặc quyền Quản trị viên.
    """
    clean_id = public_id.strip()
    if not clean_id:
        raise ValidationException("public_id không được để trống.")

    is_staff = current_user.role in ("ADMIN", "INSPECTOR", "SUPPORT")
    if not is_staff:
        # 1. Thuộc về tin đăng của người khác
        stmt_listing = (
            select(Listing.seller_user_id)
            .join(ListingRevision, Listing.id == ListingRevision.listing_id)
            .join(ListingMedia, ListingRevision.id == ListingMedia.revision_id)
            .where(
                or_(
                    ListingMedia.url.contains(clean_id),
                    ListingMedia.thumbnail_url.contains(clean_id),
                )
            )
        )
        listing_seller_id = (await db.execute(stmt_listing)).scalars().first()
        if listing_seller_id and listing_seller_id != current_user.id:
            raise ForbiddenException("Bạn không có quyền xóa hình ảnh thuộc tin đăng của người khác.")

        # 2. Thuộc về Showroom của người khác
        stmt_sr = (
            select(Showroom.owner_user_id)
            .where(
                or_(
                    Showroom.logo_url.contains(clean_id),
                    Showroom.banner_url.contains(clean_id),
                )
            )
        )
        sr_owner_id = (await db.execute(stmt_sr)).scalars().first()
        if sr_owner_id and sr_owner_id != current_user.id:
            raise ForbiddenException("Bạn không có quyền xóa hình ảnh thuộc Showroom của người khác.")

        # 3. Thuộc về avatar của người khác
        stmt_usr = select(User.id).where(User.avatar_url.contains(clean_id))
        other_user_id = (await db.execute(stmt_usr)).scalars().first()
        if other_user_id and other_user_id != current_user.id:
            raise ForbiddenException("Bạn không có quyền xóa ảnh đại diện của người khác.")

    return await media_service.delete_media(public_id=clean_id)
