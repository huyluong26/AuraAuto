"""add promotion and vnpay payment transaction tables

Revision ID: add_promotions_vnpay
Revises: add_vehicle_history
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID, JSONB

revision: str = "add_promotions_vnpay"
down_revision: Union[str, None] = "add_vehicle_history"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("listings", sa.Column("is_featured", sa.Boolean(), nullable=False, server_default=sa.false()))
    op.add_column("listings", sa.Column("featured_until", sa.DateTime(timezone=True), nullable=True))
    op.add_column("listings", sa.Column("featured_tier", sa.String(32), nullable=True))
    op.create_index("idx_listing_featured", "listings", ["status", "is_featured", "featured_until"])

    op.create_table(
        "payment_transactions",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False),
        sa.Column("user_id", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("listing_id", UUID(as_uuid=True), sa.ForeignKey("listings.id", ondelete="CASCADE"), nullable=False),
        sa.Column("order_code", sa.String(64), unique=True, nullable=False),
        sa.Column("package_code", sa.String(32), nullable=False),
        sa.Column("package_days", sa.Integer(), nullable=False),
        sa.Column("amount_vnd", sa.BigInteger(), nullable=False),
        sa.Column("provider", sa.String(20), server_default="VNPAY", nullable=False),
        sa.Column("status", sa.String(24), server_default="PENDING", nullable=False),
        sa.Column("vnp_txn_ref", sa.String(100), nullable=True),
        sa.Column("vnp_transaction_no", sa.String(100), nullable=True),
        sa.Column("vnp_bank_code", sa.String(32), nullable=True),
        sa.Column("vnp_response_code", sa.String(10), nullable=True),
        sa.Column("paid_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("raw_response", JSONB, nullable=True),
    )
    op.create_index("idx_payment_user", "payment_transactions", ["user_id"])
    op.create_index("idx_payment_listing", "payment_transactions", ["listing_id"])
    op.create_index("idx_payment_order_code", "payment_transactions", ["order_code"])


def downgrade() -> None:
    op.drop_table("payment_transactions")
    op.drop_index("idx_listing_featured", table_name="listings")
    op.drop_column("listings", "featured_tier")
    op.drop_column("listings", "featured_until")
    op.drop_column("listings", "is_featured")
