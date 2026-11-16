import uuid
from typing import Optional, List, Tuple
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.showroom import Showroom
from app.models.listing import Listing
from app.models.user import User
from app.modules.showrooms.schemas import ShowroomCreate, ShowroomUpdate
from app.shared.exceptions import NotFoundException, ForbiddenException, ConflictException


class ShowroomService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_owner_id(self, owner_id: uuid.UUID) -> Optional[Showroom]:
        stmt = select(Showroom).where(Showroom.owner_user_id == owner_id)
        res = await self.db.execute(stmt)
        return res.scalar_one_or_none()

    async def get_by_id(self, showroom_id: uuid.UUID) -> Optional[Showroom]:
        stmt = select(Showroom).where(Showroom.id == showroom_id)
        res = await self.db.execute(stmt)
        return res.scalar_one_or_none()

    async def create_or_get_for_user(self, user: User, data: ShowroomCreate) -> Showroom:
        existing = await self.get_by_owner_id(user.id)
        if existing:
            # Update existing showroom info
            existing.name = data.name
            if data.phone:
                existing.phone = data.phone
            if data.address:
                existing.address = data.address
            if data.province_code:
                existing.province_code = data.province_code
            if data.description:
                existing.description = data.description
            if data.logo_url:
                existing.logo_url = data.logo_url
            if data.banner_url:
                existing.banner_url = data.banner_url
            await self.db.commit()
            await self.db.refresh(existing)
            return existing

        showroom = Showroom(
            owner_user_id=user.id,
            name=data.name,
            phone=data.phone or user.phone,
            address=data.address,
            province_code=data.province_code or user.province_code,
            description=data.description,
            logo_url=data.logo_url,
            banner_url=data.banner_url,
            is_verified=False,
        )
        self.db.add(showroom)
        await self.db.commit()
        await self.db.refresh(showroom)
        return showroom

    async def update_my_showroom(self, user: User, data: ShowroomUpdate) -> Showroom:
        showroom = await self.get_by_owner_id(user.id)
        if not showroom:
            raise NotFoundException("Bạn chưa tạo hồ sơ Showroom / Doanh nghiệp.")

        if data.name is not None:
            showroom.name = data.name
        if data.phone is not None:
            showroom.phone = data.phone
        if data.address is not None:
            showroom.address = data.address
        if data.province_code is not None:
            showroom.province_code = data.province_code
        if data.description is not None:
            showroom.description = data.description
        if data.logo_url is not None:
            showroom.logo_url = data.logo_url
        if data.banner_url is not None:
            showroom.banner_url = data.banner_url

        await self.db.commit()
        await self.db.refresh(showroom)
        return showroom

    async def list_public_showrooms(
        self,
        province_code: Optional[str] = None,
        search: Optional[str] = None,
        is_active: Optional[bool] = None,
        page: int = 1,
        page_size: int = 20,
    ) -> Tuple[List[Showroom], int]:
        query = select(Showroom)

        if province_code:
            query = query.where(Showroom.province_code == province_code)
        if search:
            query = query.where(Showroom.name.ilike(f"%{search}%"))
        if is_active is not None:
            query = query.where(Showroom.is_active == is_active)

        count_query = select(func.count()).select_from(query.subquery())
        total = (await self.db.execute(count_query)).scalar_one()

        query = query.order_by(Showroom.is_verified.desc(), Showroom.created_at.desc())
        query = query.offset((page - 1) * page_size).limit(page_size)

        res = await self.db.execute(query)
        showrooms = list(res.scalars().all())
        return showrooms, total
