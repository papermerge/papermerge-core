"""v3.6.0: 0013 -- add system/user preferences

Revision ID: f9c92867b8a4
Revises: eb08423d69a4
Create Date: 2025-09-29 08:20:36.433124

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'f9c92867b8a4'
down_revision: Union[str, None] = 'eb08423d69a4'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table('system_preferences',
        sa.Column('singleton', sa.Boolean(), server_default='true', nullable=False),
        sa.Column('preferences', postgresql.JSONB(astext_type=sa.Text()), server_default='{}', nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('created_at', postgresql.TIMESTAMP(timezone=True), nullable=False),
        sa.Column('updated_at', postgresql.TIMESTAMP(timezone=True), nullable=False),
        sa.Column('updated_by', sa.UUID(), nullable=True),
        sa.CheckConstraint('singleton = true', name='singleton_check'),
        sa.ForeignKeyConstraint(['updated_by'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('singleton')
    )
    op.create_table('user_preferences',
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.Column('preferences', postgresql.JSONB(astext_type=sa.Text()), server_default='{}', nullable=False),
        sa.Column('created_at', postgresql.TIMESTAMP(timezone=True), nullable=False),
        sa.Column('updated_at', postgresql.TIMESTAMP(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('user_id')
    )



def downgrade() -> None:
    op.drop_table('user_preferences')
    op.drop_table('system_preferences')
