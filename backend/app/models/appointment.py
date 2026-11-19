import uuid
from datetime import datetime
from typing import Optional, List
from sqlalchemy import String, Text, Integer, DateTime, ForeignKey, Index, CheckConstraint, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel


class Appointment(BaseModel):
    __tablename__ = "appointments"

    listing_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("listings.id", ondelete="CASCADE"), nullable=False)
    buyer_user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    seller_user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    scheduled_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    location: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    note: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(
        String(24),
        default="PENDING",
        nullable=False,
    )  # PENDING, CONFIRMED, DECLINED, CANCELLED, COMPLETED
    cancel_reason_code: Mapped[Optional[str]] = mapped_column(String(40), nullable=True)
    cancel_reason_text: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    cancelled_by_user_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    version: Mapped[int] = mapped_column(Integer, default=1, nullable=False)

    __table_args__ = (
        CheckConstraint("buyer_user_id <> seller_user_id", name="ck_appt_different_users"),
        CheckConstraint("status IN ('PENDING','CONFIRMED','DECLINED','CANCELLED','COMPLETED')", name="ck_appt_status"),
        Index("idx_appt_buyer_time", "buyer_user_id", "scheduled_at"),
        Index("idx_appt_seller_status", "seller_user_id", "status", "scheduled_at"),
        Index("idx_appt_buyer_status", "buyer_user_id", "status", "scheduled_at"),
        Index("idx_appt_created_scheduled", "created_at", "scheduled_at"),
        Index("idx_appt_status_created", "status", "created_at"),
        Index(
            "uq_appt_active_buyer_listing",
            "listing_id",
            "buyer_user_id",
            unique=True,
            postgresql_where=text("status IN ('PENDING', 'CONFIRMED')"),
        ),
    )

    # Relationships
    listing: Mapped["Listing"] = relationship("Listing", back_populates="appointments")
    buyer: Mapped["User"] = relationship("User", foreign_keys=[buyer_user_id])
    seller: Mapped["User"] = relationship("User", foreign_keys=[seller_user_id])
    cancelled_by: Mapped[Optional["User"]] = relationship("User", foreign_keys=[cancelled_by_user_id])
    review: Mapped[Optional["Review"]] = relationship("Review", back_populates="appointment", uselist=False, cascade="all, delete-orphan")
    events: Mapped[List["AppointmentEvent"]] = relationship("AppointmentEvent", back_populates="appointment", cascade="all, delete-orphan")


class AppointmentEvent(BaseModel):
    __tablename__ = "appointment_events"

    appointment_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("appointments.id", ondelete="CASCADE"), nullable=False)
    actor_user_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    from_status: Mapped[Optional[str]] = mapped_column(String(24), nullable=True)
    to_status: Mapped[str] = mapped_column(String(24), nullable=False)
    note: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Relationships
    appointment: Mapped["Appointment"] = relationship("Appointment", back_populates="events")
