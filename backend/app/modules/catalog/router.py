import uuid
import re
from typing import List, Optional
from pydantic import BaseModel, Field
from fastapi import APIRouter, Depends
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_active_user
from app.core.cache import fast_cache
from app.models.user import User
from app.models.catalog import VehicleBrand, VehicleModel, VehicleVariant
from app.modules.catalog.schemas import BrandResponse, ModelResponse, VariantResponse

router = APIRouter(prefix="/catalog", tags=["Catalog"])


class ResolveBrandModelRequest(BaseModel):
    brand_name: str = Field(min_length=1, max_length=80)
    model_name: Optional[str] = Field(None, max_length=80)
    body_type: Optional[str] = "SEDAN"


class ResolveBrandModelResponse(BaseModel):
    brand_id: uuid.UUID
    brand_name: str
    model_id: Optional[uuid.UUID] = None
    model_name: Optional[str] = None


@router.post("/resolve", response_model=ResolveBrandModelResponse)
async def resolve_or_create_brand_model(
    data: ResolveBrandModelRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    b_name = data.brand_name.strip()
    stmt = select(VehicleBrand).where(func.lower(VehicleBrand.name) == func.lower(b_name))
    res = await db.execute(stmt)
    brand = res.scalar_one_or_none()
    created_new = False
    if not brand:
        b_slug = re.sub(r'[^a-zA-Z0-9]+', '-', b_name.lower()).strip('-') or 'custom-brand'
        brand = VehicleBrand(name=b_name, slug=f"{b_slug}-{uuid.uuid4().hex[:4]}", is_active=True)
        db.add(brand)
        await db.flush()
        created_new = True

    model_id = None
    resolved_model_name = None
    if data.model_name and data.model_name.strip():
        m_name = data.model_name.strip()
        m_stmt = select(VehicleModel).where(
            VehicleModel.brand_id == brand.id,
            func.lower(VehicleModel.name) == func.lower(m_name),
        )
        m_res = await db.execute(m_stmt)
        model = m_res.scalar_one_or_none()
        if not model:
            m_slug = re.sub(r'[^a-zA-Z0-9]+', '-', m_name.lower()).strip('-') or 'custom-model'
            model = VehicleModel(
                brand_id=brand.id,
                name=m_name,
                slug=f"{m_slug}-{uuid.uuid4().hex[:4]}",
                body_type=data.body_type or "SEDAN",
                is_active=True,
            )
            db.add(model)
            await db.flush()
            created_new = True
        model_id = model.id
        resolved_model_name = model.name

    await db.commit()
    if created_new:
        await fast_cache.invalidate_prefix("catalog:")

    return ResolveBrandModelResponse(
        brand_id=brand.id,
        brand_name=brand.name,
        model_id=model_id,
        model_name=resolved_model_name,
    )


@router.get("/brands", response_model=List[BrandResponse])
async def list_brands(db: AsyncSession = Depends(get_db)):
    cache_key = "catalog:brands"
    cached = await fast_cache.get(cache_key)
    if cached is not None:
        return cached

    stmt = select(VehicleBrand).where(VehicleBrand.is_active == True).order_by(VehicleBrand.name.asc())
    result = await db.execute(stmt)
    brands = result.scalars().all()
    await fast_cache.set(cache_key, brands, ttl_seconds=3600)
    return brands


@router.get("/brands/{brand_id}/models", response_model=List[ModelResponse])
async def list_models_by_brand(brand_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    cache_key = f"catalog:models:{brand_id}"
    cached = await fast_cache.get(cache_key)
    if cached is not None:
        return cached

    stmt = select(VehicleModel).where(
        VehicleModel.brand_id == brand_id,
        VehicleModel.is_active == True,
    ).order_by(VehicleModel.name.asc())
    result = await db.execute(stmt)
    models = result.scalars().all()
    await fast_cache.set(cache_key, models, ttl_seconds=3600)
    return models


@router.get("/models/{model_id}/variants", response_model=List[VariantResponse])
async def list_variants_by_model(model_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    cache_key = f"catalog:variants:{model_id}"
    cached = await fast_cache.get(cache_key)
    if cached is not None:
        return cached

    stmt = select(VehicleVariant).where(
        VehicleVariant.model_id == model_id,
        VehicleVariant.is_active == True,
    ).order_by(VehicleVariant.name.asc())
    result = await db.execute(stmt)
    variants = result.scalars().all()
    await fast_cache.set(cache_key, variants, ttl_seconds=3600)
    return variants
