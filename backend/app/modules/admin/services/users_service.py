import uuid
from datetime import datetime, timezone
from typing import List, Optional
from sqlalchemy import select, func, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import get_password_hash
from app.models.user import User
from app.models.showroom import Showroom
from app.models.payment import PaymentTransaction
from app.modules.admin.schemas import (
    AdminCreateShowroomRequest,
    AdminCreateUserRequest,
    AdminUpdateShowroomRequest,
    AdminUpdateUserRequest,
    BulkDeleteShowroomRequest,
    BulkUpdateShowroomStatusRequest,
    BulkUpdateUserStatusRequest,
    BulkVerifyShowroomRequest,
    UpdateUserRoleRequest,
    UpdateUserStatusRequest,
    VerifyShowroomRequest,
)
from app.modules.auth.schemas import UserBriefResponse, ShowroomBriefResponse
from app.shared.exceptions import NotFoundException, ConflictException, ForbiddenException
from app.shared.schemas import SuccessResponse



class AdminUsersMixin:
    db: AsyncSession

    # ==========================================
    # 3. USERS MANAGEMENT
    # ==========================================
    async def list_users(
        self,
        role: Optional[str] = None,
        status_filter: Optional[str] = None,
        search: Optional[str] = None,
        limit: int = 50,
        offset: int = 0,
    ) -> List[UserBriefResponse]:
        db = self.db
        stmt = select(User).order_by(User.created_at.desc())
        if role:
            stmt = stmt.where(User.role == role.upper())
        if status_filter:
            stmt = stmt.where(User.status == status_filter.upper())
        if search:
            kw = f"%{search.strip()}%"
            stmt = stmt.where(
                or_(
                    User.display_name.ilike(kw),
                    User.email.ilike(kw),
                    User.phone.like(kw),
                )
            )

        stmt = stmt.limit(limit).offset(offset)
        res = await db.execute(stmt)
        users = res.scalars().all()

        user_ids = [u.id for u in users]
        sr_map = {}
        if user_ids:
            sr_stmt = select(Showroom).where(Showroom.owner_user_id.in_(user_ids))
            sr_res = await db.execute(sr_stmt)
            for sr in sr_res.scalars().all():
                sr_map[sr.owner_user_id] = sr

        results = []
        for u in users:
            sr = sr_map.get(u.id)
            sr_brief = None
            acc_type = "INDIVIDUAL"
            if sr:
                acc_type = "SHOWROOM"
                sr_brief = ShowroomBriefResponse(
                    id=sr.id,
                    name=sr.name,
                    phone=sr.phone or u.phone,
                    address=sr.address or u.address,
                    province_code=sr.province_code or u.province_code,
                    description=sr.description,
                    logo_url=sr.logo_url,
                    banner_url=sr.banner_url,
                    is_verified=sr.is_verified,
                    created_at=sr.created_at,
                )

            results.append(
                UserBriefResponse(
                    id=u.id,
                    email=u.email,
                    display_name=u.display_name,
                    phone=u.phone,
                    province_code=u.province_code,
                    province_name=u.province_name,
                    address=u.address,
                    role=u.role,
                    status=u.status,
                    avatar_url=u.avatar_url,
                    is_email_verified=bool(u.email_verified_at),
                    account_type=acc_type,
                    showroom=sr_brief,
                    created_at=u.created_at,
                )
            )
        return results

    async def create_user(self, data: AdminCreateUserRequest) -> UserBriefResponse:
        db = self.db
        existing_stmt = select(User).where(
            or_(User.email == data.email.lower(), User.phone == data.phone if data.phone else False)
        )
        res = await db.execute(existing_stmt)
        if res.scalar_one_or_none():
            raise ConflictException("Email hoặc số điện thoại đã tồn tại trên hệ thống")

        new_user = User(
            email=data.email.lower(),
            password_hash=get_password_hash(data.password),
            display_name=data.display_name.strip(),
            phone=data.phone,
            role=data.role.upper(),
            status="ACTIVE",
            province_code=data.province_code,
            province_name=data.province_name,
            address=data.address,
            email_verified_at=datetime.now(timezone.utc),
        )
        db.add(new_user)
        await db.commit()
        await db.refresh(new_user)

        return UserBriefResponse(
            id=new_user.id,
            email=new_user.email,
            display_name=new_user.display_name,
            phone=new_user.phone,
            province_code=new_user.province_code,
            province_name=new_user.province_name,
            address=new_user.address,
            role=new_user.role,
            status=new_user.status,
            avatar_url=new_user.avatar_url,
            is_email_verified=True,
            created_at=new_user.created_at,
        )

    async def update_user(self, id: uuid.UUID, data: AdminUpdateUserRequest) -> SuccessResponse:
        db = self.db
        stmt = select(User).where(User.id == id)
        res = await db.execute(stmt)
        target_user = res.scalar_one_or_none()
        if not target_user:
            raise NotFoundException("Người dùng không tồn tại")

        if data.display_name is not None:
            target_user.display_name = data.display_name.strip()
        if data.phone is not None:
            target_user.phone = data.phone.strip()
        if data.password:
            target_user.password_hash = get_password_hash(data.password)
        if data.province_code is not None:
            target_user.province_code = data.province_code
        if data.province_name is not None:
            target_user.province_name = data.province_name
        if data.address is not None:
            target_user.address = data.address
        if data.role is not None:
            target_user.role = data.role.upper()
        if data.status is not None:
            target_user.status = data.status.upper()

        await db.commit()
        return SuccessResponse(message="Cập nhật thông tin người dùng thành công")

    async def delete_user(self, id: uuid.UUID, super_admin: User) -> SuccessResponse:
        db = self.db
        stmt = select(User).where(User.id == id)
        res = await db.execute(stmt)
        target_user = res.scalar_one_or_none()
        if not target_user:
            raise NotFoundException("Người dùng không tồn tại")

        if target_user.id == super_admin.id:
            raise ForbiddenException("Bạn không thể tự xóa tài khoản của chính mình")

        tx_stmt = select(func.count(PaymentTransaction.id)).where(PaymentTransaction.user_id == id)
        has_tx = (await db.scalar(tx_stmt)) or 0
        if has_tx > 0:
            target_user.status = "DELETED"
            target_user.deleted_at = datetime.now(timezone.utc)
            await db.commit()
            return SuccessResponse(message="Tài khoản có lịch sử giao dịch thanh toán đã được lưu trữ và đánh dấu đã xóa (Bảo toàn dữ liệu thanh toán).")

        await db.delete(target_user)
        await db.commit()
        return SuccessResponse(message="Đã xóa vĩnh viễn người dùng khỏi hệ thống")

    async def update_user_status(self, id: uuid.UUID, data: UpdateUserStatusRequest, admin_user: User) -> SuccessResponse:
        db = self.db
        stmt = select(User).where(User.id == id)
        res = await db.execute(stmt)
        target_user = res.scalar_one_or_none()
        if not target_user:
            raise NotFoundException("Người dùng không tồn tại")

        if target_user.id == admin_user.id:
            raise ForbiddenException("Bạn không thể tự thay đổi trạng thái của chính mình")

        target_user.status = data.status.upper()
        await db.commit()
        return SuccessResponse(message=f"Đã cập nhật trạng thái người dùng thành '{data.status}'")

    async def bulk_update_user_status(self, data: BulkUpdateUserStatusRequest, admin_user: User) -> SuccessResponse:
        db = self.db
        valid_ids = [uid for uid in data.user_ids if uid != admin_user.id]
        if not valid_ids:
            return SuccessResponse(message="Không có tài khoản hợp lệ để cập nhật")

        stmt = select(User).where(User.id.in_(valid_ids))
        res = await db.execute(stmt)
        users = res.scalars().all()

        for u in users:
            u.status = data.status.upper()

        await db.commit()
        return SuccessResponse(message=f"Đã cập nhật trạng thái {len(users)} tài khoản thành '{data.status}'")

    async def update_user_role(self, id: uuid.UUID, data: UpdateUserRoleRequest, super_admin: User) -> SuccessResponse:
        db = self.db
        stmt = select(User).where(User.id == id)
        res = await db.execute(stmt)
        target_user = res.scalar_one_or_none()
        if not target_user:
            raise NotFoundException("Người dùng không tồn tại")

        if target_user.id == super_admin.id and data.role.upper() != "ADMIN":
            raise ForbiddenException("Bạn không thể tự hạ quyền Admin của chính mình")

        target_user.role = data.role.upper()
        await db.commit()
        return SuccessResponse(message=f"Đã cập nhật vai trò người dùng thành '{data.role}'")

    # ==========================================
    # 4. SHOWROOMS MANAGEMENT
    # ==========================================
    async def create_showroom(self, data: AdminCreateShowroomRequest) -> SuccessResponse:
        db = self.db
        owner_stmt = select(User).where(User.id == data.owner_user_id)
        res = await db.execute(owner_stmt)
        owner = res.scalar_one_or_none()
        if not owner:
            raise NotFoundException("Chủ sở hữu tài khoản không tồn tại")

        existing_stmt = select(Showroom).where(Showroom.owner_user_id == data.owner_user_id)
        if (await db.execute(existing_stmt)).scalar_one_or_none():
            raise ConflictException("Người dùng này đã sở hữu một Showroom trên hệ thống")

        sr = Showroom(
            id=uuid.uuid4(),
            owner_user_id=data.owner_user_id,
            name=data.name.strip(),
            phone=data.phone,
            address=data.address,
            province_code=data.province_code,
            description=data.description,
            logo_url=data.logo_url,
            banner_url=data.banner_url,
            is_verified=data.is_verified,
            is_active=data.is_active,
        )
        db.add(sr)
        await db.commit()
        return SuccessResponse(message="Đã tạo mới hồ sơ Showroom thành công")

    async def update_showroom(self, id: uuid.UUID, data: AdminUpdateShowroomRequest) -> SuccessResponse:
        db = self.db
        stmt = select(Showroom).where(Showroom.id == id)
        res = await db.execute(stmt)
        sr = res.scalar_one_or_none()
        if not sr:
            raise NotFoundException("Showroom không tồn tại")

        payload = data.model_dump(exclude_unset=True)
        for field, value in payload.items():
            if hasattr(sr, field) and value is not None:
                setattr(sr, field, value)

        await db.commit()
        return SuccessResponse(message="Cập nhật hồ sơ Showroom thành công")

    async def delete_showroom(self, id: uuid.UUID) -> SuccessResponse:
        db = self.db
        stmt = select(Showroom).where(Showroom.id == id)
        res = await db.execute(stmt)
        sr = res.scalar_one_or_none()
        if not sr:
            raise NotFoundException("Showroom không tồn tại")

        await db.delete(sr)
        await db.commit()
        return SuccessResponse(message="Đã xóa vĩnh viễn Showroom khỏi hệ thống")

    async def verify_showroom(self, id: uuid.UUID, data: VerifyShowroomRequest, admin_user: User) -> SuccessResponse:
        db = self.db
        stmt = select(Showroom).where(Showroom.id == id)
        res = await db.execute(stmt)
        sr = res.scalar_one_or_none()
        if not sr:
            raise NotFoundException("Showroom không tồn tại")

        sr.is_verified = data.is_verified
        sr.verified_at = datetime.now(timezone.utc) if data.is_verified else None
        sr.verified_by_user_id = admin_user.id if data.is_verified else None
        sr.rejection_reason = data.rejection_reason if not data.is_verified else None

        await db.commit()
        status_msg = "Xác thực đối tác chính thức" if data.is_verified else "Hủy xác thực đối tác"
        return SuccessResponse(message=f"Đã cập nhật trạng thái showroom: {status_msg}")

    async def bulk_update_showroom_status(self, data: BulkUpdateShowroomStatusRequest) -> SuccessResponse:
        db = self.db
        if not data.showroom_ids:
            return SuccessResponse(message="Không có showroom nào được chọn")

        stmt = select(Showroom).where(Showroom.id.in_(data.showroom_ids))
        res = await db.execute(stmt)
        showrooms = res.scalars().all()

        for s in showrooms:
            s.is_active = data.is_active

        await db.commit()
        action_name = "kích hoạt" if data.is_active else "tạm khóa"
        return SuccessResponse(message=f"Đã {action_name} thành công {len(showrooms)} Showroom")

    async def bulk_verify_showroom(self, data: BulkVerifyShowroomRequest, admin_user: User) -> SuccessResponse:
        db = self.db
        if not data.showroom_ids:
            return SuccessResponse(message="Không có showroom nào được chọn")

        stmt = select(Showroom).where(Showroom.id.in_(data.showroom_ids))
        res = await db.execute(stmt)
        showrooms = res.scalars().all()

        now = datetime.now(timezone.utc)
        for s in showrooms:
            s.is_verified = data.is_verified
            s.verified_at = now if data.is_verified else None
            s.verified_by_user_id = admin_user.id if data.is_verified else None

        await db.commit()
        action_name = "xác thực đối tác" if data.is_verified else "hủy xác thực"
        return SuccessResponse(message=f"Đã {action_name} thành công cho {len(showrooms)} Showroom")

    async def bulk_delete_showroom(self, data: BulkDeleteShowroomRequest) -> SuccessResponse:
        db = self.db
        if not data.showroom_ids:
            return SuccessResponse(message="Không có showroom nào được chọn")

        stmt = select(Showroom).where(Showroom.id.in_(data.showroom_ids))
        res = await db.execute(stmt)
        showrooms = res.scalars().all()

        for s in showrooms:
            await db.delete(s)

        await db.commit()
        return SuccessResponse(message=f"Đã xóa vĩnh viễn {len(showrooms)} Showroom khỏi hệ thống")

