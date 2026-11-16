from typing import Any, Generic, List, Optional, TypeVar
from pydantic import BaseModel, Field

T = TypeVar("T")


class PaginationMeta(BaseModel):
    page: int = Field(ge=1, default=1, description="Trang hiện tại")
    page_size: int = Field(ge=1, le=100, default=20, description="Số lượng mục mỗi trang")
    total: int = Field(ge=0, default=0, description="Tổng số mục")
    total_pages: int = Field(ge=0, default=0, description="Tổng số trang")


class PaginatedResponse(BaseModel, Generic[T]):
    items: List[T]
    pagination: PaginationMeta


class ErrorDetail(BaseModel):
    code: str
    message: str
    details: Optional[Any] = None
    request_id: Optional[str] = None


class ErrorResponse(BaseModel):
    error: ErrorDetail


class SuccessResponse(BaseModel):
    success: bool = True
    message: str = "Thành công"
    data: Optional[Any] = None
