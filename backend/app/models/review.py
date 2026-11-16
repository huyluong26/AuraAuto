import uuid
from typing import Optional
from sqlalchemy import String, Text, SmallInteger, ForeignKey, CheckConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel


class Review(BaseModel):
    __tablename__ = "reviews"

    appointment_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("appointments.id", ondelete="CASCADE"), unique=True, nullable=False)
    reviewer_user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    seller_user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    rating: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    comment: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="VISIBLE", nullable=False)  # VISIBLE, HIDDEN, REMOVED
    hidden_reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    hidden_by_user_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    __table_args__ = (
        CheckConstraint("rating BETWEEN 1 AND 5", name="ck_review_rating_range"),
    )

    # Relationships
    appointment: Mapped["Appointment"] = relationship("Appointment", back_populates="review")
    reviewer: Mapped["User"] = relationship("User", foreign_keys=[reviewer_user_id])
    seller: Mapped["User"] = relationship("User", foreign_keys=[seller_user_id])
