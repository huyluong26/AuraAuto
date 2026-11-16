import uuid
from datetime import datetime
from typing import Optional, List
from sqlalchemy import String, Text, Integer, BigInteger, Boolean, DateTime, ForeignKey, Index, CheckConstraint, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel


class Listing(BaseModel):
    __tablename__ = "listings"

    seller_user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    showroom_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("showrooms.id", ondelete="SET NULL"), nullable=True)
    status: Mapped[str] = mapped_column(
        String(24),
        default="DRAFT",
        nullable=False,
    )  # DRAFT, PENDING_REVIEW, REJECTED, PUBLISHED, HIDDEN, SOLD, REMOVED
    published_revision_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("listing_revisions.id", ondelete="SET NULL", use_alter=True, name="fk_listing_published_revision"),
        nullable=True,
    )
    version: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    published_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    sold_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    views_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    favorites_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    contacts_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    is_featured: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    featured_until: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    featured_tier: Mapped[Optional[str]] = mapped_column(String(32), nullable=True)

    __table_args__ = (
        CheckConstraint(
            "status IN ('DRAFT','PENDING_REVIEW','REJECTED','PUBLISHED','HIDDEN','SOLD','REMOVED')",
            name="ck_listing_status"
        ),
        Index("idx_listing_seller_status", "seller_user_id", "status"),
        Index("idx_listing_status_published_at", "status", "published_at"),
        Index("idx_listing_featured", "status", "is_featured", "featured_until"),
    )

    # Relationships
    seller: Mapped["User"] = relationship("User", back_populates="listings", foreign_keys=[seller_user_id])
    showroom: Mapped[Optional["Showroom"]] = relationship("Showroom", back_populates="listings")
    revisions: Mapped[List["ListingRevision"]] = relationship("ListingRevision", back_populates="listing", foreign_keys="ListingRevision.listing_id", cascade="all, delete-orphan")
    published_revision: Mapped[Optional["ListingRevision"]] = relationship("ListingRevision", foreign_keys=[published_revision_id], post_update=True)
    appointments: Mapped[List["Appointment"]] = relationship("Appointment", back_populates="listing", cascade="all, delete-orphan")
    conversations: Mapped[List["Conversation"]] = relationship("Conversation", back_populates="listing", cascade="all, delete-orphan")
    status_events: Mapped[List["ListingStatusEvent"]] = relationship("ListingStatusEvent", back_populates="listing", cascade="all, delete-orphan")


class ListingRevision(BaseModel):
    __tablename__ = "listing_revisions"

    listing_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("listings.id", ondelete="CASCADE"), nullable=False)
    revision_no: Mapped[int] = mapped_column(Integer, nullable=False)
    brand_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("vehicle_brands.id", ondelete="RESTRICT"), nullable=False)
    model_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("vehicle_models.id", ondelete="RESTRICT"), nullable=False)
    variant_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("vehicle_variants.id", ondelete="RESTRICT"), nullable=True)

    title: Mapped[str] = mapped_column(String(200), nullable=False)
    price_vnd: Mapped[int] = mapped_column(BigInteger, nullable=False)
    manufacture_year: Mapped[int] = mapped_column(Integer, nullable=False)
    odometer_km: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    mileage_unknown: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    condition: Mapped[str] = mapped_column(String(100), default="USED", nullable=False)  # USED, NEW, or detailed status
    body_type: Mapped[str] = mapped_column(String(100), nullable=False)
    fuel_type: Mapped[str] = mapped_column(String(50), nullable=False)
    transmission: Mapped[str] = mapped_column(String(50), nullable=False)
    origin: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    color: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    interior_color: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    seats: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    doors: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    province_code: Mapped[str] = mapped_column(String(10), nullable=False)
    location_address: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    vin: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    license_plate: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    accident_status: Mapped[str] = mapped_column(String(20), default="UNKNOWN", nullable=False)
    flood_status: Mapped[str] = mapped_column(String(20), default="UNKNOWN", nullable=False)
    service_history: Mapped[str] = mapped_column(String(20), default="UNKNOWN", nullable=False)
    owner_count: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    repainted_parts_count: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    replaced_parts: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    engine_repaired: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    transmission_repaired: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # 160-Point Technical Inspection
    inspection_report_pdf_url: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    inspection_score: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    inspection_inspector_name: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    inspection_checklist: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)

    review_status: Mapped[str] = mapped_column(String(20), default="DRAFT", nullable=False)  # DRAFT, PENDING, APPROVED, REJECTED
    rejection_reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    reviewed_by_user_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    reviewed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    __table_args__ = (
        CheckConstraint("price_vnd > 0", name="ck_revision_price_positive"),
        CheckConstraint("manufacture_year BETWEEN 1900 AND 2100", name="ck_revision_year_range"),
        Index("uq_listing_revision_no", "listing_id", "revision_no", unique=True),
        Index("idx_revision_listing_review", "listing_id", "review_status"),
    )

    # Relationships
    listing: Mapped["Listing"] = relationship("Listing", back_populates="revisions", foreign_keys=[listing_id])
    media: Mapped[List["ListingMedia"]] = relationship("ListingMedia", back_populates="revision", cascade="all, delete-orphan")
    brand: Mapped["VehicleBrand"] = relationship("VehicleBrand")
    model: Mapped["VehicleModel"] = relationship("VehicleModel")
    variant: Mapped[Optional["VehicleVariant"]] = relationship("VehicleVariant")


class ListingMedia(BaseModel):
    __tablename__ = "listing_media"

    revision_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("listing_revisions.id", ondelete="CASCADE"), nullable=False)
    media_type: Mapped[str] = mapped_column(String(20), default="IMAGE", nullable=False)  # IMAGE, VIDEO
    url: Mapped[str] = mapped_column(Text, nullable=False)
    thumbnail_url: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    public_id: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    sort_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    is_primary: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    label: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)

    # Relationships
    revision: Mapped["ListingRevision"] = relationship("ListingRevision", back_populates="media")


class ListingStatusEvent(BaseModel):
    __tablename__ = "listing_status_events"

    listing_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("listings.id", ondelete="CASCADE"), nullable=False)
    actor_user_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    from_status: Mapped[Optional[str]] = mapped_column(String(24), nullable=True)
    to_status: Mapped[str] = mapped_column(String(24), nullable=False)
    reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Relationships
    listing: Mapped["Listing"] = relationship("Listing", back_populates="status_events")
