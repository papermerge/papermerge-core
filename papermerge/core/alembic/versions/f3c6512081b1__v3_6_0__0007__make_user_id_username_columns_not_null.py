"""v3.6.0: 0007 -- make user_id, username columns not NULL

Revision ID: f3c6512081b1
Revises: ed681f3a1768
Create Date: 2025-08-26 05:43:20.201923

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = 'f3c6512081b1'
down_revision: Union[str, None] = 'ed681f3a1768'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.alter_column('audit_log', 'user_id',
               existing_type=sa.UUID(),
               nullable=False)
    op.alter_column('audit_log', 'username',
               existing_type=sa.VARCHAR(length=150),
               nullable=False)


def downgrade() -> None:
    op.alter_column('audit_log', 'username',
               existing_type=sa.VARCHAR(length=150),
               nullable=True)
    op.alter_column('audit_log', 'user_id',
               existing_type=sa.UUID(),
               nullable=True)
