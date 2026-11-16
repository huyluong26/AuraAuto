import uuid
from typing import Optional, List
from pydantic import BaseModel, ConfigDict


class VariantResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    model_id: uuid.UUID
    name: str
    engine_capacity: Optional[str] = None
    fuel_type: Optional[str] = None
    transmission: Optional[str] = None


class ModelResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    brand_id: uuid.UUID
    name: str
    slug: str
    body_type: Optional[str] = None


class BrandResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    slug: str
    logo_url: Optional[str] = None
