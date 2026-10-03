"""create notes table

Revision ID: b7e2d4f81c35
Revises: a1f3c9d27b40
Create Date: 2026-10-03 12:05:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = 'b7e2d4f81c35'
down_revision: Union[str, None] = 'a1f3c9d27b40'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table('notes',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('landlord_id', sa.Integer(), nullable=False),
    sa.Column('entity_type', sa.Enum('PROPERTY', 'CLIENT', 'CONTRACT', 'SERVICE', name='noteentitytype'), nullable=False),
    sa.Column('entity_id', sa.Integer(), nullable=False),
    sa.Column('content', sa.Text(), nullable=False),
    sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
    sa.ForeignKeyConstraint(['landlord_id'], ['landlords.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_notes_entity', 'notes', ['entity_type', 'entity_id'], unique=False)


def downgrade() -> None:
    op.drop_index('ix_notes_entity', table_name='notes')
    op.drop_table('notes')
    op.execute('DROP TYPE noteentitytype')
