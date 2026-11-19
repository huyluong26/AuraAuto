import uuid
from datetime import datetime, timezone
from typing import List, Optional
from pydantic import BaseModel
from fastapi import APIRouter, Depends
from sqlalchemy import select, desc, func, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_active_user
from app.models.user import User
from app.models.notification import Notification
from app.shared.exceptions import NotFoundException
from app.shared.schemas import SuccessResponse

router = APIRouter(prefix="/me/notifications", tags=["Notifications"])


class NotificationResponse(BaseModel):
    id: uuid.UUID
    title: str
    body: str
    type: str
    reference_type: Optional[str] = None
    reference_id: Optional[uuid.UUID] = None
    is_read: bool
    read_at: Optional[datetime] = None
    created_at: datetime


class UnreadCountResponse(BaseModel):
    unread_count: int


@router.get("", response_model=List[NotificationResponse])
async def list_notifications(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    stmt = (
        select(Notification)
        .where(Notification.user_id == current_user.id)
        .order_by(desc(Notification.created_at))
        .limit(50)
    )
    res = await db.execute(stmt)
    notis = res.scalars().all()

    return [
        NotificationResponse(
            id=n.id,
            title=n.title,
            body=n.body,
            type=n.type,
            reference_type=n.reference_type,
            reference_id=n.reference_id,
            is_read=n.is_read,
            read_at=n.read_at,
            created_at=n.created_at,
        )
        for n in notis
    ]


@router.get("/unread-count", response_model=UnreadCountResponse)
async def get_unread_count(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Lấy số lượng thông báo chưa đọc của người dùng."""
    stmt = select(func.count(Notification.id)).where(
        Notification.user_id == current_user.id,
        Notification.is_read.is_(False),
    )
    count = (await db.execute(stmt)).scalar() or 0
    return UnreadCountResponse(unread_count=count)


@router.post("/read-all", response_model=SuccessResponse)
async def mark_all_notifications_read(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Đánh dấu tất cả thông báo của người dùng là đã đọc."""
    now = datetime.now(timezone.utc)
    stmt = (
        update(Notification)
        .where(
            Notification.user_id == current_user.id,
            Notification.is_read.is_(False),
        )
        .values(
            is_read=True,
            read_at=now,
        )
    )
    await db.execute(stmt)
    await db.commit()
    return SuccessResponse(message="Đã đánh dấu đã đọc tất cả thông báo")


@router.post("/{id}/read", response_model=SuccessResponse)
@router.patch("/{id}/read", response_model=SuccessResponse)
async def mark_notification_read(
    id: uuid.UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(Notification).where(
        Notification.id == id,
        Notification.user_id == current_user.id,
    )
    res = await db.execute(stmt)
    noti = res.scalar_one_or_none()
    if not noti:
        raise NotFoundException("Thông báo không tồn tại")

    noti.is_read = True
    noti.read_at = datetime.now(timezone.utc)
    await db.commit()

    return SuccessResponse(message="Đã đánh dấu thông báo đã đọc")
