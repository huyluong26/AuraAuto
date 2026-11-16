import uuid
from datetime import datetime
from typing import Optional, List
from sqlalchemy import String, Text, DateTime, ForeignKey, Index
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel


class Report(BaseModel):
    __tablename__ = "reports"

    reporter_user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    target_type: Mapped[str] = mapped_column(String(30), nullable=False)  # LISTING, USER, SHOWROOM
    target_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False)
    reason_code: Mapped[str] = mapped_column(String(50), nullable=False)  # FAKE_LISTING, SPAM, SCAM, INAPPROPRIATE
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="PENDING", nullable=False)  # PENDING, INVESTIGATING, RESOLVED, REJECTED
    resolution_note: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    resolved_by_user_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    resolved_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    __table_args__ = (
        Index("idx_reports_status", "status"),
        Index("idx_reports_target", "target_type", "target_id"),
    )

    # Relationships
    reporter: Mapped["User"] = relationship("User", foreign_keys=[reporter_user_id])
    evidences: Mapped[List["ReportEvidence"]] = relationship("ReportEvidence", back_populates="report", cascade="all, delete-orphan")
    actions: Mapped[List["ModerationAction"]] = relationship("ModerationAction", back_populates="report")


class ReportEvidence(BaseModel):
    __tablename__ = "report_evidences"

    report_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("reports.id", ondelete="CASCADE"), nullable=False)
    media_url: Mapped[str] = mapped_column(Text, nullable=False)

    # Relationships
    report: Mapped["Report"] = relationship("Report", back_populates="evidences")


class ModerationAction(BaseModel):
    __tablename__ = "moderation_actions"

    report_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("reports.id", ondelete="SET NULL"), nullable=True)
    actor_user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="RESTRICT"), nullable=False)
    action_type: Mapped[str] = mapped_column(String(40), nullable=False)  # WARNING, HIDE_LISTING, REMOVE_LISTING, SUSPEND_USER, BAN_USER, DISMISS
    target_user_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=True)
    reason: Mapped[str] = mapped_column(Text, nullable=False)

    # Relationships
    report: Mapped[Optional["Report"]] = relationship("Report", back_populates="actions")
    actor: Mapped["User"] = relationship("User", foreign_keys=[actor_user_id])
    appeals: Mapped[List["Appeal"]] = relationship("Appeal", back_populates="moderation_action")


class Appeal(BaseModel):
    __tablename__ = "appeals"

    moderation_action_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("moderation_actions.id", ondelete="CASCADE"), nullable=False)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    reason: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="PENDING", nullable=False)  # PENDING, ACCEPTED, REJECTED
    admin_decision_note: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    decided_by_user_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    decided_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    # Relationships
    moderation_action: Mapped["ModerationAction"] = relationship("ModerationAction", back_populates="appeals")
    user: Mapped["User"] = relationship("User", foreign_keys=[user_id])
