import uuid
from typing import Optional, List
from sqlalchemy import String, Text, Boolean, ForeignKey, Index
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel


class VehicleBrand(BaseModel):
    __tablename__ = "vehicle_brands"

    name: Mapped[str] = mapped_column(String(80), unique=True, nullable=False)
    slug: Mapped[str] = mapped_column(String(80), unique=True, index=True, nullable=False)
    logo_url: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # Relationships
    models: Mapped[List["VehicleModel"]] = relationship("VehicleModel", back_populates="brand", cascade="all, delete-orphan")


class VehicleModel(BaseModel):
    __tablename__ = "vehicle_models"

    brand_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("vehicle_brands.id", ondelete="RESTRICT"), nullable=False)
    name: Mapped[str] = mapped_column(String(80), nullable=False)
    slug: Mapped[str] = mapped_column(String(80), index=True, nullable=False)
    body_type: Mapped[Optional[str]] = mapped_column(String(30), nullable=True)  # SEDAN, SUV, MPV, PICKUP, etc.
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    __table_args__ = (
        Index("uq_brand_model_name", "brand_id", "name", unique=True),
    )

    # Relationships
    brand: Mapped["VehicleBrand"] = relationship("VehicleBrand", back_populates="models")
    variants: Mapped[List["VehicleVariant"]] = relationship("VehicleVariant", back_populates="model", cascade="all, delete-orphan")


class VehicleVariant(BaseModel):
    __tablename__ = "vehicle_variants"

    model_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("vehicle_models.id", ondelete="RESTRICT"), nullable=False)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    engine_capacity: Mapped[Optional[str]] = mapped_column(String(40), nullable=True)
    fuel_type: Mapped[Optional[str]] = mapped_column(String(30), nullable=True)  # GASOLINE, DIESEL, HYBRID, ELECTRIC
    transmission: Mapped[Optional[str]] = mapped_column(String(30), nullable=True)  # MANUAL, AUTOMATIC
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    __table_args__ = (
        Index("uq_model_variant_name", "model_id", "name", unique=True),
    )

    # Relationships
    model: Mapped["VehicleModel"] = relationship("VehicleModel", back_populates="variants")
