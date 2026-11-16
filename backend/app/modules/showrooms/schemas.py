import uuid
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict


class ShowroomCreate(BaseModel):
    name: str = Field(min_length=3, max_length=150, description="Tên Showroom hoặc Doanh nghiệp")
    phone: Optional[str] = Field(None, max_length=20, description="Hotline kinh doanh của showroom")
    address: Optional[str] = Field(None, description="Địa chỉ showroom / bãi xe")
    province_code: Optional[str] = Field(None, max_length=10, description="Mã tỉnh thành")
    description: Optional[str] = Field(None, description="Giới thiệu showroom, chính sách bảo hành")
    logo_url: Optional[str] = None
    banner_url: Optional[str] = None


class ShowroomUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=3, max_length=150)
    phone: Optional[str] = None
    address: Optional[str] = None
    province_code: Optional[str] = None
    description: Optional[str] = None
    logo_url: Optional[str] = None
    banner_url: Optional[str] = None


class ShowroomResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    owner_user_id: uuid.UUID
    name: str
    phone: Optional[str] = None
    address: Optional[str] = None
    province_code: Optional[str] = None
    description: Optional[str] = None
    logo_url: Optional[str] = None
    banner_url: Optional[str] = None
    is_verified: bool = False
    verified_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime


class ShowroomPublicResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    phone: Optional[str] = None
    address: Optional[str] = None
    province_code: Optional[str] = None
    description: Optional[str] = None
    logo_url: Optional[str] = None
    banner_url: Optional[str] = None
    is_verified: bool = False
    active_listings_count: int = 0


class ShowroomListResponse(BaseModel):
    items: List[ShowroomPublicResponse]
    total: int
    page: int
    page_size: int

