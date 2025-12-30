"""add api_tokens table

Revision ID: c1fa0c57ba3e
Revises: 89be7e6a3444
Create Date: 2025-12-30 06:07:43.167420

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'c1fa0c57ba3e'
down_revision: Union[str, None] = '89be7e6a3444'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table('api_tokens',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('user_id', sa.UUID(), nullable=False),
    sa.Column('name', sa.String(length=255), nullable=False),
    sa.Column('token_hash', sa.String(length=64), nullable=False),
    sa.Column('token_prefix', sa.String(length=12), nullable=False),
    sa.Column('scopes', sa.String(length=2000), nullable=True),
    sa.Column('created_at', postgresql.TIMESTAMP(timezone=True), nullable=False),
    sa.Column('expires_at', postgresql.TIMESTAMP(timezone=True), nullable=True),
    sa.Column('last_used_at', postgresql.TIMESTAMP(timezone=True), nullable=True),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('token_hash')
    )
    op.create_index('idx_api_tokens_token_hash', 'api_tokens', ['token_hash'], unique=False)
    op.create_index('idx_api_tokens_user_id', 'api_tokens', ['user_id'], unique=False)


def downgrade() -> None:
    op.drop_index('idx_api_tokens_user_id', table_name='api_tokens')
    op.drop_index('idx_api_tokens_token_hash', table_name='api_tokens')
    op.drop_table('api_tokens')
