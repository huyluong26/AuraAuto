"""add promotion_packages table

Revision ID: add_promotion_packages
Revises: add_promotions_vnpay
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

revision: str = "add_promotion_packages"
down_revision: Union[str, None] = "add_promotions_vnpay"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "promotion_packages",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False),
        sa.Column("code", sa.String(32), unique=True, nullable=False),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column("days", sa.Integer(), nullable=False),
        sa.Column("amount_vnd", sa.BigInteger(), nullable=False),
        sa.Column("original_amount_vnd", sa.BigInteger(), nullable=True),
        sa.Column("description", sa.String(255), nullable=True),
        sa.Column("badge", sa.String(50), nullable=True),
        sa.Column("is_active", sa.Boolean(), server_default=sa.true(), nullable=False),
        sa.Column("sort_order", sa.Integer(), server_default="0", nullable=False),
    )
    op.create_index("idx_promo_package_code", "promotion_packages", ["code"])
    op.create_index("idx_promo_package_active", "promotion_packages", ["is_active"])


def downgrade() -> None:
    op.drop_index("idx_promo_package_active", table_name="promotion_packages")
    op.drop_index("idx_promo_package_code", table_name="promotion_packages")
    op.drop_table("promotion_packages")
