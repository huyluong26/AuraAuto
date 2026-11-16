"""initial_schema

Revision ID: 26f999f7d47c
Revises: 
Create Date: 2026-11-11 13:14:00.348378+00:00

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '26f999f7d47c'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    from app.models import Base
    bind = op.get_bind()
    Base.metadata.create_all(bind)


def downgrade() -> None:
    from app.models import Base
    bind = op.get_bind()
    Base.metadata.drop_all(bind)
