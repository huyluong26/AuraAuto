from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, status
from typing import Optional, List

from app.core.deps import get_current_active_user
from app.models.user import User
from app.modules.media.schemas import (
    MediaUploadResponse,
    MediaSignUploadRequest,
    MediaSignUploadResponse,
    MediaDeleteResponse,
)
from app.modules.media.service import media_service
from app.shared.exceptions import ValidationException

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
):
    """
    Xóa file ảnh hoặc video trên Cloudinary theo public_id.
    Yêu cầu xác thực tài khoản.
    """
    if not public_id.strip():
        raise ValidationException("public_id không được để trống.")

    return await media_service.delete_media(public_id=public_id)
