"""add extra_data to property

Revision ID: a1f3c9d27b40
Revises: 2dcf368b072a
Create Date: 2026-10-03 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'a1f3c9d27b40'
down_revision: Union[str, None] = '2dcf368b072a'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('properties', sa.Column('extra_data', postgresql.JSONB(astext_type=sa.Text()), nullable=True))


def downgrade() -> None:
    op.drop_column('properties', 'extra_data')
