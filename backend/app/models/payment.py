import uuid
from datetime import datetime
from typing import Optional
from sqlalchemy import String, Integer, BigInteger, DateTime, ForeignKey, Index, JSON, Boolean
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel


class PromotionPackage(BaseModel):
    __tablename__ = "promotion_packages"

    code: Mapped[str] = mapped_column(String(32), unique=True, index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    days: Mapped[int] = mapped_column(Integer, nullable=False)
    amount_vnd: Mapped[int] = mapped_column(BigInteger, nullable=False)
    original_amount_vnd: Mapped[Optional[int]] = mapped_column(BigInteger, nullable=True)  # Giá gốc trước khuyến mãi
    description: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    badge: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    sort_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    __table_args__ = (
        Index("idx_promo_package_code", "code"),
        Index("idx_promo_package_active", "is_active"),
    )


class PaymentTransaction(BaseModel):
    __tablename__ = "payment_transactions"

    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    listing_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("listings.id", ondelete="CASCADE"), nullable=False)
    order_code: Mapped[str] = mapped_column(String(64), unique=True, index=True, nullable=False)
    package_code: Mapped[str] = mapped_column(String(32), nullable=False)  # PROMO_1_DAY, PROMO_3_DAYS, PROMO_7_DAYS, PROMO_30_DAYS
    package_days: Mapped[int] = mapped_column(Integer, nullable=False)
    amount_vnd: Mapped[int] = mapped_column(BigInteger, nullable=False)
    provider: Mapped[str] = mapped_column(String(20), default="VNPAY", nullable=False)
    status: Mapped[str] = mapped_column(String(24), default="PENDING", nullable=False)  # PENDING, SUCCESS, FAILED, CANCELLED
    vnp_txn_ref: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    vnp_transaction_no: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    vnp_bank_code: Mapped[Optional[str]] = mapped_column(String(32), nullable=True)
    vnp_response_code: Mapped[Optional[str]] = mapped_column(String(10), nullable=True)
    paid_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    raw_response: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)

    __table_args__ = (
        Index("idx_payment_user", "user_id"),
        Index("idx_payment_listing", "listing_id"),
        Index("idx_payment_order_code", "order_code"),
    )

    # Relationships
    user = relationship("User", foreign_keys=[user_id])
    listing = relationship("Listing", foreign_keys=[listing_id])
