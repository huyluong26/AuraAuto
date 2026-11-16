from typing import Optional
from fastapi import APIRouter, Depends, Request, BackgroundTasks, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import get_db
from app.core.deps import get_current_active_user
from app.core.email import send_email_sync, render_verify_email_html, render_reset_password_html
from app.models.user import User
from app.models.showroom import Showroom
from app.modules.auth.schemas import (
    RegisterRequest,
    LoginRequest,
    TokenResponse,
    VerifyEmailRequest,
    RefreshTokenRequest,
    LogoutRequest,
    ForgotPasswordRequest,
    ResetPasswordRequest,
    ChangePasswordRequest,
    UserBriefResponse,
    ShowroomBriefResponse,
    UpdateProfileRequest,
)
from app.modules.auth.service import AuthService
from app.shared.schemas import SuccessResponse

router = APIRouter(prefix="/auth", tags=["Authentication"])


async def _user_to_brief(user: User, db: AsyncSession) -> UserBriefResponse:
    stmt = select(Showroom).where(Showroom.owner_user_id == user.id)
    res = await db.execute(stmt)
    sr = res.scalar_one_or_none()
    sr_brief = None
    account_type = "INDIVIDUAL"
    if sr:
        account_type = "SHOWROOM"
        sr_brief = ShowroomBriefResponse(
            id=sr.id,
            name=sr.name,
            phone=sr.phone,
            address=sr.address,
            province_code=sr.province_code,
            description=sr.description,
            logo_url=sr.logo_url,
            banner_url=sr.banner_url,
            is_verified=sr.is_verified,
            created_at=sr.created_at,
        )

    return UserBriefResponse(
        id=user.id,
        email=user.email,
        display_name=user.display_name,
        phone=user.phone,
        province_code=user.province_code,
        province_name=user.province_name,
        address=user.address,
        role=user.role,
        avatar_url=user.avatar_url,
        is_email_verified=user.email_verified_at is not None,
        account_type=account_type,
        showroom=sr_brief,
        created_at=user.created_at,
    )


@router.post("/register", response_model=SuccessResponse, status_code=status.HTTP_201_CREATED)
async def register(
    data: RegisterRequest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
):
    service = AuthService(db)
    user, token = await service.register(data)
    is_showroom = (data.account_type or "INDIVIDUAL").upper() == "SHOWROOM"

    # Gửi email xác thực tài khoản qua tác vụ ngầm
    if user.email:
        background_tasks.add_task(
            send_email_sync,
            user.email,
            "Xác thực tài khoản AuraAuto của bạn",
            render_verify_email_html(user.display_name, token),
        )

    return SuccessResponse(
        message=(
            "Đăng ký tài khoản Doanh nghiệp / Showroom thành công! Vui lòng xác thực tài khoản để bắt đầu."
            if is_showroom
            else "Đăng ký tài khoản cá nhân thành công! Vui lòng xác thực tài khoản để bắt đầu."
        ),
        data={
            "user_id": str(user.id),
            "account_type": "SHOWROOM" if is_showroom else "INDIVIDUAL",
            "verification_token": token if settings.DEBUG else None,
        },
    )


@router.post("/login", response_model=TokenResponse)
async def login(
    data: LoginRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    service = AuthService(db)
    user_agent = request.headers.get("user-agent")
    user, access_token, refresh_token = await service.login(data, device_info=user_agent)
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        refresh_token=refresh_token,
        user=await _user_to_brief(user, db),
    )


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(
    data: RefreshTokenRequest,
    db: AsyncSession = Depends(get_db),
):
    service = AuthService(db)
    user, new_access, new_refresh = await service.refresh_session(data.refresh_token)
    return TokenResponse(
        access_token=new_access,
        token_type="bearer",
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        refresh_token=new_refresh,
        user=await _user_to_brief(user, db),
    )


@router.post("/logout", response_model=SuccessResponse)
async def logout(
    data: Optional[LogoutRequest] = None,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    service = AuthService(db)
    raw_refresh = data.refresh_token if data else None
    await service.logout(current_user.id, raw_refresh)
    return SuccessResponse(message="Đăng xuất thành công, phiên làm việc đã được thu hồi")


@router.post("/forgot-password", response_model=SuccessResponse)
async def forgot_password(
    data: ForgotPasswordRequest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
):
    service = AuthService(db)
    token = await service.forgot_password(data.email)
    if token:
        background_tasks.add_task(
            send_email_sync,
            data.email,
            "Yêu cầu đặt lại mật khẩu AuraAuto",
            render_reset_password_html("Quý khách", token),
        )

    return SuccessResponse(
        message="Nếu email tồn tại trên hệ thống, hướng dẫn đặt lại mật khẩu đã được gửi.",
        data={"reset_token": token if settings.DEBUG else None},
    )


@router.post("/reset-password", response_model=SuccessResponse)
async def reset_password(
    data: ResetPasswordRequest,
    db: AsyncSession = Depends(get_db),
):
    service = AuthService(db)
    await service.reset_password(data.token, data.new_password)
    return SuccessResponse(message="Đặt lại mật khẩu thành công! Bạn có thể đăng nhập bằng mật khẩu mới.")


@router.post("/verify-email", response_model=SuccessResponse)
async def verify_email(
    data: VerifyEmailRequest,
    db: AsyncSession = Depends(get_db),
):
    service = AuthService(db)
    await service.verify_email_token(data.token)
    return SuccessResponse(message="Xác thực email thành công! Bây giờ bạn có thể đăng tin.")


@router.get("/me", response_model=UserBriefResponse)
async def get_me(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    return await _user_to_brief(current_user, db)


@router.patch("/me", response_model=UserBriefResponse)
async def update_profile(
    data: UpdateProfileRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    service = AuthService(db)
    updated_user = await service.update_profile(current_user, data)
    return await _user_to_brief(updated_user, db)


@router.post("/change-password", response_model=SuccessResponse)
async def change_password(
    data: ChangePasswordRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    service = AuthService(db)
    await service.change_password(current_user, data.current_password, data.new_password)
    return SuccessResponse(message="Đổi mật khẩu thành công! Mật khẩu mới của bạn đã có hiệu lực.")
