import uuid
from datetime import datetime
from typing import Optional, Any
from sqlalchemy import String, Text, BigInteger, Float, Boolean, DateTime, ForeignKey, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel


class AIModelVersion(BaseModel):
    __tablename__ = "ai_model_versions"

    model_name: Mapped[str] = mapped_column(String(50), nullable=False)  # LINEAR_REGRESSION, RANDOM_FOREST, CATBOOST
    version_tag: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    mae_vnd: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    rmse_vnd: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    r2_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    artifact_path: Mapped[str] = mapped_column(Text, nullable=False)
    features_schema: Mapped[Optional[Any]] = mapped_column(JSON, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    trained_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)


class AIPrediction(BaseModel):
    __tablename__ = "ai_predictions"

    model_version_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("ai_model_versions.id", ondelete="SET NULL"), nullable=True)
    user_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    input_features: Mapped[Any] = mapped_column(JSON, nullable=False)
    estimated_price_vnd: Mapped[Optional[int]] = mapped_column(BigInteger, nullable=True)
    interval_low_vnd: Mapped[Optional[int]] = mapped_column(BigInteger, nullable=True)
    interval_high_vnd: Mapped[Optional[int]] = mapped_column(BigInteger, nullable=True)
    interval_method: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    latency_ms: Mapped[Optional[int]] = mapped_column(BigInteger, nullable=True)


class UserPreference(BaseModel):
    __tablename__ = "user_preferences"

    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    preferred_brands: Mapped[Optional[Any]] = mapped_column(JSON, nullable=True)  # list of brand_ids or names
    preferred_body_types: Mapped[Optional[Any]] = mapped_column(JSON, nullable=True)  # list of strings
    min_price_vnd: Mapped[Optional[int]] = mapped_column(BigInteger, nullable=True)
    max_price_vnd: Mapped[Optional[int]] = mapped_column(BigInteger, nullable=True)
    min_year: Mapped[Optional[int]] = mapped_column(BigInteger, nullable=True)
    fuel_type: Mapped[Optional[str]] = mapped_column(String(30), nullable=True)


class UserBehaviorEvent(BaseModel):
    __tablename__ = "user_behavior_events"

    user_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    session_id: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    event_type: Mapped[str] = mapped_column(String(50), nullable=False)  # VIEW_LISTING, FAVORITE, SEARCH, CONTACT
    listing_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("listings.id", ondelete="SET NULL"), nullable=True)
    event_data: Mapped[Optional[Any]] = mapped_column(JSON, nullable=True)
