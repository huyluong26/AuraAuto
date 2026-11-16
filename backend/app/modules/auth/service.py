import hashlib
import uuid
from datetime import datetime, timedelta, timezone
from typing import Tuple, Optional
from sqlalchemy import select, or_, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.security import (
    verify_password,
    get_password_hash,
    create_access_token,
    create_refresh_token,
)
from app.models.user import User, AuthSession, EmailVerificationToken, PasswordResetToken
from app.models.showroom import Showroom
from app.modules.auth.schemas import (
    RegisterRequest,
    LoginRequest,
    UpdateProfileRequest,
    ForgotPasswordRequest,
    ResetPasswordRequest,
)
from app.shared.exceptions import ConflictException, UnauthorizedException, AppException


def _hash_token(raw_token: str) -> str:
    """Fast deterministic SHA-256 hash for high-entropy tokens."""
    return hashlib.sha256(raw_token.strip().encode("utf-8")).hexdigest()


class AuthService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def register(self, data: RegisterRequest) -> Tuple[User, str]:
        # 1. Kiểm tra tính duy nhất của Email
        stmt_email = select(User).where(User.email == data.email.lower())
        res_email = await self.db.execute(stmt_email)
        if res_email.scalar_one_or_none():
            raise ConflictException("Email này đã được sử dụng trên hệ thống")

        # 2. Kiểm tra tính duy nhất của Số điện thoại (nếu có cung cấp)
        if data.phone:
            stmt_phone = select(User).where(User.phone == data.phone)
            res_phone = await self.db.execute(stmt_phone)
            if res_phone.scalar_one_or_none():
                raise ConflictException("Số điện thoại này đã được sử dụng cho tài khoản khác")

        # 3. Tạo User với mật khẩu băm chuẩn bcrypt & vị trí địa lý
        user = User(
            email=data.email.lower(),
            password_hash=get_password_hash(data.password),
            display_name=data.display_name,
            phone=data.phone,
            province_code=data.province_code,
            province_name=data.province_name,
            address=data.address,
            role="USER",
            status="ACTIVE",
            email_verified_at=datetime.now(timezone.utc),
        )
        self.db.add(user)
        await self.db.flush()

        # 3.1. Nếu là tài khoản Doanh nghiệp / Showroom, khởi tạo ngay hồ sơ Showroom
        if (data.account_type or "INDIVIDUAL").upper() == "SHOWROOM" and data.showroom_name:
            desc = f"Showroom kinh doanh xe {data.showroom_name.strip()}"
            if data.tax_code:
                desc += f" (MST: {data.tax_code.strip()})"
            showroom = Showroom(
                owner_user_id=user.id,
                name=data.showroom_name.strip(),
                phone=data.phone,
                address=data.address,
                province_code=data.province_code,
                description=desc,
                is_verified=False,
            )
            self.db.add(showroom)

        # 4. Tạo token xác thực Email bằng SHA-256 (truy vấn O(1) tức thì)
        raw_token = create_refresh_token()
        verif_token = EmailVerificationToken(
            user_id=user.id,
            token_hash=_hash_token(raw_token),
            expires_at=datetime.now(timezone.utc) + timedelta(hours=24),
        )
        self.db.add(verif_token)
        await self.db.commit()
        await self.db.refresh(user)

        return user, raw_token

    async def login(self, data: LoginRequest, device_info: Optional[str] = None) -> Tuple[User, str, str]:
        ident = data.identifier.strip()

        # Hỗ trợ tìm tài khoản bằng Email HOẶC Số điện thoại
        if "@" in ident:
            stmt = select(User).where(User.email == ident.lower())
        else:
            stmt = select(User).where(
                or_(
                    User.phone == ident,
                    User.email == ident.lower(),
                )
            )

        res = await self.db.execute(stmt)
        user = res.scalar_one_or_none()

        # Kiểm tra tồn tại và so khớp mật khẩu băm
        if not user or not user.password_hash or not verify_password(data.password, user.password_hash):
            raise UnauthorizedException("Email/Số điện thoại hoặc mật khẩu không chính xác")

        if user.status == "SUSPENDED":
            raise AppException(status_code=403, code="ACCOUNT_SUSPENDED", message="Tài khoản đã bị tạm khóa")
        if user.status == "DELETED" or user.deleted_at is not None:
            raise UnauthorizedException("Tài khoản đã bị xóa khỏi hệ thống")

        # Sinh access token & refresh token session
        access_token = create_access_token(subject=user.id, role=user.role)
        raw_refresh = create_refresh_token()
        session = AuthSession(
            user_id=user.id,
            refresh_token_hash=_hash_token(raw_refresh),
            device_info=device_info,
            expires_at=datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
        )
        self.db.add(session)
        await self.db.commit()

        return user, access_token, raw_refresh

    async def update_profile(self, user: User, data: UpdateProfileRequest) -> User:
        if data.display_name:
            user.display_name = data.display_name.strip()

        if data.phone:
            # Kiểm tra số điện thoại không trùng với user khác
            stmt = select(User).where(User.phone == data.phone, User.id != user.id)
            res = await self.db.execute(stmt)
            if res.scalar_one_or_none():
                raise ConflictException("Số điện thoại này đã được sử dụng bởi người dùng khác")
            user.phone = data.phone

        if data.avatar_url is not None:
            user.avatar_url = data.avatar_url

        if data.province_code is not None:
            user.province_code = data.province_code

        if data.province_name is not None:
            user.province_name = data.province_name

        if data.address is not None:
            user.address = data.address

        await self.db.commit()
        await self.db.refresh(user)
        return user

    async def verify_email_token(self, token_str: str) -> bool:
        """Xác thực token email tức thì bằng index hash SHA-256 O(1), fallback bcrypt cho token cũ."""
        target_hash = _hash_token(token_str)
        now = datetime.now(timezone.utc)

        # 1. Tra cứu trực tiếp theo SHA-256 index
        stmt = select(EmailVerificationToken).where(
            EmailVerificationToken.token_hash == target_hash,
            EmailVerificationToken.used_at.is_(None),
            EmailVerificationToken.expires_at > now,
        )
        res = await self.db.execute(stmt)
        matched_token = res.scalar_one_or_none()

        # 2. Tương thích ngược: kiểm tra token cũ đã băm bằng bcrypt
        if not matched_token:
            legacy_stmt = select(EmailVerificationToken).where(
                EmailVerificationToken.token_hash.startswith("$2b$"),
                EmailVerificationToken.used_at.is_(None),
                EmailVerificationToken.expires_at > now,
            )
            legacy_res = await self.db.execute(legacy_stmt)
            for t in legacy_res.scalars().all():
                if verify_password(token_str, t.token_hash):
                    matched_token = t
                    break

        if not matched_token:
            raise AppException(status_code=400, code="INVALID_TOKEN", message="Mã xác thực không hợp lệ hoặc đã hết hạn")

        matched_token.used_at = now
        stmt_user = select(User).where(User.id == matched_token.user_id)
        u_res = await self.db.execute(stmt_user)
        user = u_res.scalar_one_or_none()
        if user:
            user.email_verified_at = now

        await self.db.commit()
        return True

    async def refresh_session(self, raw_refresh_token: str) -> Tuple[User, str, str]:
        """Xác thực refresh token session, thu hồi session cũ và cấp cặp token mới (Token Rotation)."""
        target_hash = _hash_token(raw_refresh_token)
        now = datetime.now(timezone.utc)

        stmt = select(AuthSession).where(
            AuthSession.refresh_token_hash == target_hash,
            AuthSession.revoked_at.is_(None),
            AuthSession.expires_at > now,
        )
        res = await self.db.execute(stmt)
        session = res.scalar_one_or_none()

        # Tương thích ngược bcrypt
        if not session:
            legacy_stmt = select(AuthSession).where(
                AuthSession.refresh_token_hash.startswith("$2b$"),
                AuthSession.revoked_at.is_(None),
                AuthSession.expires_at > now,
            )
            for s in (await self.db.execute(legacy_stmt)).scalars().all():
                if verify_password(raw_refresh_token, s.refresh_token_hash):
                    session = s
                    break

        if not session:
            raise UnauthorizedException("Phiên đăng nhập không hợp lệ hoặc đã hết hạn")

        # Thu hồi session cũ (Rotation)
        session.revoked_at = now

        # Lấy thông tin người dùng
        stmt_user = select(User).where(User.id == session.user_id)
        user = (await self.db.execute(stmt_user)).scalar_one_or_none()
        if not user or user.status != "ACTIVE":
            raise UnauthorizedException("Tài khoản không ở trạng thái hoạt động")

        # Cấp access token mới và refresh token session mới
        new_access = create_access_token(subject=user.id, role=user.role)
        new_refresh = create_refresh_token()
        new_session = AuthSession(
            user_id=user.id,
            refresh_token_hash=_hash_token(new_refresh),
            device_info=session.device_info,
            expires_at=now + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
        )
        self.db.add(new_session)
        await self.db.commit()

        return user, new_access, new_refresh

    async def logout(self, user_id: uuid.UUID, raw_refresh_token: Optional[str] = None) -> bool:
        """Đăng xuất và thu hồi phiên đăng nhập refresh token."""
        now = datetime.now(timezone.utc)
        if raw_refresh_token:
            target_hash = _hash_token(raw_refresh_token)
            stmt = select(AuthSession).where(
                AuthSession.user_id == user_id,
                AuthSession.refresh_token_hash == target_hash,
                AuthSession.revoked_at.is_(None),
            )
            res = await self.db.execute(stmt)
            session = res.scalar_one_or_none()
            if session:
                session.revoked_at = now
        else:
            await self.db.execute(
                update(AuthSession)
                .where(AuthSession.user_id == user_id, AuthSession.revoked_at.is_(None))
                .values(revoked_at=now)
            )
        await self.db.commit()
        return True

    async def forgot_password(self, email: str) -> Optional[str]:
        """Tạo token đặt lại mật khẩu cho người dùng."""
        stmt = select(User).where(User.email == email.lower(), User.status == "ACTIVE")
        res = await self.db.execute(stmt)
        user = res.scalar_one_or_none()
        if not user:
            return None  # Không tiết lộ email có tồn tại hay không

        raw_token = create_refresh_token()
        reset_token = PasswordResetToken(
            user_id=user.id,
            token_hash=_hash_token(raw_token),
            expires_at=datetime.now(timezone.utc) + timedelta(hours=2),
        )
        self.db.add(reset_token)
        await self.db.commit()
        return raw_token

    async def reset_password(self, token_str: str, new_password: str) -> bool:
        """Đặt lại mật khẩu bằng token hợp lệ."""
        target_hash = _hash_token(token_str)
        now = datetime.now(timezone.utc)

        stmt = select(PasswordResetToken).where(
            PasswordResetToken.token_hash == target_hash,
            PasswordResetToken.used_at.is_(None),
            PasswordResetToken.expires_at > now,
        )
        res = await self.db.execute(stmt)
        token_record = res.scalar_one_or_none()

        if not token_record:
            raise AppException(status_code=400, code="INVALID_RESET_TOKEN", message="Mã khôi phục mật khẩu không hợp lệ hoặc đã hết hạn")

        token_record.used_at = now
        stmt_user = select(User).where(User.id == token_record.user_id)
        user = (await self.db.execute(stmt_user)).scalar_one_or_none()
        if not user:
            raise AppException(status_code=400, code="USER_NOT_FOUND", message="Người dùng không tồn tại")

        user.password_hash = get_password_hash(new_password)
        # Thu hồi tất cả các phiên đăng nhập cũ để bảo vệ tài khoản
        await self.db.execute(
            update(AuthSession)
            .where(AuthSession.user_id == user.id, AuthSession.revoked_at.is_(None))
            .values(revoked_at=now)
        )
        await self.db.commit()
        return True

    async def change_password(self, user: User, current_password: str, new_password: str) -> bool:
        """Đổi mật khẩu người dùng đã đăng nhập."""
        if not user.password_hash or not verify_password(current_password, user.password_hash):
            raise AppException(status_code=400, code="INVALID_PASSWORD", message="Mật khẩu hiện tại không chính xác")

        user.password_hash = get_password_hash(new_password)
        await self.db.commit()
        return True
