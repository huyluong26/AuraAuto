import os
import io
import time
import uuid
import logging
import asyncio
from typing import Optional

try:
    import cloudinary
    import cloudinary.uploader
    import cloudinary.utils
    HAS_CLOUDINARY = True
except ImportError:
    cloudinary = None
    HAS_CLOUDINARY = False

from app.core.config import settings
from app.modules.media.schemas import (
    MediaUploadResponse,
    MediaSignUploadResponse,
    MediaDeleteResponse,
)

logger = logging.getLogger(__name__)

# Thư mục lưu trữ local dự phòng khi chưa cấu hình Cloudinary API Keys
LOCAL_UPLOAD_DIR = os.path.join(os.getcwd(), "uploads")
os.makedirs(LOCAL_UPLOAD_DIR, exist_ok=True)


class CloudinaryMediaService:
    def __init__(self):
        self.cloud_name = settings.CLOUDINARY_CLOUD_NAME.strip()
        self.api_key = settings.CLOUDINARY_API_KEY.strip()
        self.api_secret = settings.CLOUDINARY_API_SECRET.strip()

        self.is_configured = bool(HAS_CLOUDINARY and self.cloud_name and self.api_key and self.api_secret)

        if self.is_configured:
            cloudinary.config(
                cloud_name=self.cloud_name,
                api_key=self.api_key,
                api_secret=self.api_secret,
                secure=True,
            )
            logger.info(f"Cloudinary initialized with cloud_name: {self.cloud_name}")
        else:
            logger.warning(
                "Cloudinary credentials missing in .env. Service will use local filesystem fallback."
            )

    async def upload_media(
        self,
        file_bytes: bytes,
        filename: str,
        folder: str = "used_cars",
    ) -> MediaUploadResponse:
        """Tải file (ảnh hoặc video) lên Cloudinary hoặc lưu local nếu chưa cấu hình."""
        if self.is_configured:
            try:
                # Upload to Cloudinary in worker thread to prevent blocking async event loop
                def _do_upload():
                    file_stream = io.BytesIO(file_bytes)
                    file_stream.name = filename
                    return cloudinary.uploader.upload(
                        file_stream,
                        folder=folder,
                        resource_type="auto",
                        transformation=[
                            {"quality": "auto", "fetch_format": "auto"}
                        ],
                    )

                upload_result = await asyncio.to_thread(_do_upload)
                return MediaUploadResponse(
                    public_id=upload_result.get("public_id"),
                    url=upload_result.get("url"),
                    secure_url=upload_result.get("secure_url"),
                    format=upload_result.get("format", "jpg"),
                    resource_type=upload_result.get("resource_type", "image"),
                    width=upload_result.get("width"),
                    height=upload_result.get("height"),
                    bytes=upload_result.get("bytes", len(file_bytes)),
                    storage_type="cloudinary",
                )
            except Exception as e:
                logger.error(f"Cloudinary upload error: {e}. Falling back to local storage.")

        # Fallback Local Storage
        ext = os.path.splitext(filename)[1] or ".jpg"
        file_id = f"{uuid.uuid4().hex[:12]}{ext}"
        local_path = os.path.join(LOCAL_UPLOAD_DIR, file_id)
        with open(local_path, "wb") as f:
            f.write(file_bytes)

        local_url = f"/uploads/{file_id}"
        return MediaUploadResponse(
            public_id=f"local_{file_id}",
            url=local_url,
            secure_url=local_url,
            format=ext.replace(".", ""),
            resource_type="image",
            width=None,
            height=None,
            bytes=len(file_bytes),
            storage_type="local_fallback",
        )

    async def delete_media(self, public_id: str) -> MediaDeleteResponse:
        """Xóa file khỏi Cloudinary hoặc xóa file local nếu là local_fallback."""
        if public_id.startswith("local_"):
            clean_filename = os.path.basename(public_id.replace("local_", "").strip())
            upload_dir_abs = os.path.abspath(LOCAL_UPLOAD_DIR)
            local_path = os.path.abspath(os.path.join(upload_dir_abs, clean_filename))

            if os.path.commonpath([local_path, upload_dir_abs]) != upload_dir_abs:
                return MediaDeleteResponse(
                    public_id=public_id,
                    result="error",
                    message="Đường dẫn file không hợp lệ.",
                )

            if os.path.exists(local_path) and os.path.isfile(local_path):
                os.remove(local_path)
                return MediaDeleteResponse(
                    public_id=public_id,
                    result="ok",
                    message="File local đã được xóa thành công.",
                )
            return MediaDeleteResponse(
                public_id=public_id,
                result="not_found",
                message="Không tìm thấy file local cần xóa.",
            )

        if self.is_configured:
            try:
                res = await asyncio.to_thread(cloudinary.uploader.destroy, public_id, invalidate=True)
                result_status = res.get("result", "not_found")
                return MediaDeleteResponse(
                    public_id=public_id,
                    result=result_status,
                    message=f"Cloudinary status: {result_status}",
                )
            except Exception as e:
                logger.error(f"Cloudinary destroy error: {e}")
                return MediaDeleteResponse(
                    public_id=public_id,
                    result="error",
                    message=f"Lỗi khi xóa file trên Cloudinary: {str(e)}",
                )

        return MediaDeleteResponse(
            public_id=public_id,
            result="not_found",
            message="Chưa cấu hình Cloudinary credentials để xóa file từ xa.",
        )

    def generate_upload_signature(self, folder: str = "used_cars") -> MediaSignUploadResponse:
        """Tạo chữ ký upload (Signed Upload URL) cho client upload trực tiếp theo SCR-12 / API Contract."""
        if not self.is_configured:
            return MediaSignUploadResponse(
                signature="mock_local_signature",
                timestamp=int(time.time()),
                api_key="mock_api_key",
                cloud_name="mock_cloud",
                folder=folder,
            )

        timestamp = int(time.time())
        params_to_sign = {
            "folder": folder,
            "timestamp": timestamp,
        }
        signature = cloudinary.utils.api_sign_request(params_to_sign, self.api_secret)

        return MediaSignUploadResponse(
            signature=signature,
            timestamp=timestamp,
            api_key=self.api_key,
            cloud_name=self.cloud_name,
            folder=folder,
        )


media_service = CloudinaryMediaService()
