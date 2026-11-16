import uuid
from typing import Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_user, get_optional_user
from app.models.user import User
from app.modules.showrooms.schemas import (
    ShowroomCreate,
    ShowroomUpdate,
    ShowroomResponse,
    ShowroomPublicResponse,
    ShowroomListResponse,
)
from app.modules.showrooms.service import ShowroomService
from app.shared.exceptions import NotFoundException

router = APIRouter(prefix="/showrooms", tags=["Showrooms"])


@router.post("", response_model=ShowroomResponse, status_code=status.HTTP_201_CREATED)
async def create_or_register_showroom(
    data: ShowroomCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Đăng ký hoặc tạo mới hồ sơ Showroom / Doanh nghiệp cho người bán."""
    service = ShowroomService(db)
    showroom = await service.create_or_get_for_user(current_user, data)
    return showroom


@router.get("/my", response_model=Optional[ShowroomResponse])
async def get_my_showroom(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Lấy thông tin Showroom của tài khoản người bán đang đăng nhập."""
    service = ShowroomService(db)
    showroom = await service.get_by_owner_id(current_user.id)
    return showroom


@router.put("/my", response_model=ShowroomResponse)
async def update_my_showroom(
    data: ShowroomUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Cập nhật thông tin Showroom của tài khoản hiện tại."""
    service = ShowroomService(db)
    return await service.update_my_showroom(current_user, data)


@router.get("/{showroom_id}", response_model=ShowroomPublicResponse)
async def get_showroom_detail(
    showroom_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    """Xem thông tin chi tiết Showroom công khai."""
    service = ShowroomService(db)
    showroom = await service.get_by_id(showroom_id)
    if not showroom:
        raise NotFoundException("Không tìm thấy thông tin Showroom.")
    return showroom


@router.get("", response_model=ShowroomListResponse)
async def list_showrooms(
    province_code: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    is_active: Optional[bool] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    """Danh sách các Showroom / Đại lý xe đã tham gia sàn."""
    service = ShowroomService(db)
    items, total = await service.list_public_showrooms(
        province_code=province_code,
        search=search,
        is_active=is_active,
        page=page,
        page_size=page_size,
    )
    return ShowroomListResponse(
        items=[ShowroomPublicResponse.model_validate(s) for s in items],
        total=total,
        page=page,
        page_size=page_size,
    )
