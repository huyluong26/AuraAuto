from typing import Optional
from pydantic import BaseModel, Field


class MediaUploadResponse(BaseModel):
    public_id: str
    url: str
    secure_url: str
    format: Optional[str] = "jpg"
    resource_type: str = "image"
    width: Optional[int] = None
    height: Optional[int] = None
    bytes: int = 0
    storage_type: str = "cloudinary"  # cloudinary or local_fallback


class MediaSignUploadRequest(BaseModel):
    folder: str = Field(default="used_cars", description="Thư mục lưu trữ trên Cloudinary")


class MediaSignUploadResponse(BaseModel):
    signature: str
    timestamp: int
    api_key: str
    cloud_name: str
    folder: str


class MediaDeleteResponse(BaseModel):
    public_id: str
    result: str  # ok, not_found, or error
    message: str
