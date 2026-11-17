import uuid
from datetime import datetime, timezone
from typing import Optional
from fastapi import Depends, Header
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import get_db
from app.models.user import User
from app.shared.exceptions import UnauthorizedException, ForbiddenException

oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl=f"{settings.API_V1_STR}/auth/login",
    auto_error=False,
)


async def get_current_user(
    token: Optional[str] = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:
    """Validate JWT token and return active current user."""
    if not token:
        raise UnauthorizedException("Yêu cầu mã xác thực (Bearer token)")

    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM],
        )
        user_id_str: str = payload.get("sub")
        if not user_id_str:
            raise UnauthorizedException("Token không chứa thông tin định danh")
        user_id = uuid.UUID(user_id_str)
    except (JWTError, ValueError):
        raise UnauthorizedException("Token không hợp lệ hoặc đã hết hạn")

    stmt = select(User).where(User.id == user_id)
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()

    if not user:
        raise UnauthorizedException("Người dùng không tồn tại")
    if user.status == "SUSPENDED":
        raise ForbiddenException("Tài khoản của bạn đã bị tạm khóa. Vui lòng liên hệ hỗ trợ.")
    if user.status == "DELETED" or user.deleted_at is not None:
        raise UnauthorizedException("Tài khoản đã bị xóa")

    return user


async def get_current_active_user(
    current_user: User = Depends(get_current_user),
) -> User:
    if current_user.status != "ACTIVE":
        raise ForbiddenException("Tài khoản không ở trạng thái hoạt động")
    return current_user


INTERNAL_STAFF_ROLES = ("ADMIN", "INSPECTOR", "SUPPORT")


async def get_current_verified_user(
    current_user: User = Depends(get_current_active_user),
) -> User:
    """Ensure user has verified their email address before performing protected actions.
    Internal staff and administrators are automatically exempt."""
    if current_user.role in INTERNAL_STAFF_ROLES:
        return current_user
    if not current_user.email_verified_at:
        raise ForbiddenException("Vui lòng xác thực địa chỉ email trước khi thực hiện thao tác này.")
    return current_user


async def require_admin(
    current_user: User = Depends(get_current_active_user),
) -> User:
    """Ensure user has ADMIN or internal staff privileges."""
    if current_user.role not in INTERNAL_STAFF_ROLES:
        raise ForbiddenException("Chỉ quản trị viên hoặc nhân sự nội bộ mới có quyền truy cập")
    return current_user


async def require_super_admin(
    current_user: User = Depends(get_current_active_user),
) -> User:
    """Ensure user is a full ADMIN (super admin)."""
    if current_user.role != "ADMIN":
        raise ForbiddenException("Chỉ Quản trị viên cấp cao (ADMIN) mới có quyền thực hiện thao tác này")
    return current_user


async def get_optional_user(
    token: Optional[str] = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
) -> Optional[User]:
    """Optionally resolve user if token is provided, returns None otherwise."""
    if not token:
        return None
    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM],
        )
        user_id_str = payload.get("sub")
        if not user_id_str:
            return None
        user_id = uuid.UUID(user_id_str)
        stmt = select(User).where(User.id == user_id, User.status == "ACTIVE")
        result = await db.execute(stmt)
        return result.scalar_one_or_none()
    except Exception:
        return None
