"""add structured vehicle history fields

Revision ID: add_vehicle_history
Revises: 26f999f7d47c
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "add_vehicle_history"
down_revision: Union[str, None] = "26f999f7d47c"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("listing_revisions", sa.Column("accident_status", sa.String(20), nullable=False, server_default="UNKNOWN"))
    op.add_column("listing_revisions", sa.Column("flood_status", sa.String(20), nullable=False, server_default="UNKNOWN"))
    op.add_column("listing_revisions", sa.Column("service_history", sa.String(20), nullable=False, server_default="UNKNOWN"))
    op.add_column("listing_revisions", sa.Column("owner_count", sa.Integer(), nullable=True))
    op.add_column("listing_revisions", sa.Column("repainted_parts_count", sa.Integer(), nullable=True))
    op.add_column("listing_revisions", sa.Column("replaced_parts", sa.Text(), nullable=True))
    op.add_column("listing_revisions", sa.Column("engine_repaired", sa.Boolean(), nullable=False, server_default=sa.false()))
    op.add_column("listing_revisions", sa.Column("transmission_repaired", sa.Boolean(), nullable=False, server_default=sa.false()))


def downgrade() -> None:
    for column in (
        "transmission_repaired", "engine_repaired", "replaced_parts", "repainted_parts_count",
        "owner_count", "service_history", "flood_status", "accident_status",
    ):
        op.drop_column("listing_revisions", column)
