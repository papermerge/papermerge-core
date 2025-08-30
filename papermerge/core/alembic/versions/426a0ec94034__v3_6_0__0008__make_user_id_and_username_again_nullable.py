"""v3.6.0: 0007 -- make user_id and username again nullable

Revision ID: 426a0ec94034
Revises: f3c6512081b1
Create Date: 2025-08-30 08:03:50.606651

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '426a0ec94034'
down_revision: Union[str, None] = 'f3c6512081b1'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.alter_column('audit_log', 'user_id',
               existing_type=sa.UUID(),
               nullable=True)
    op.alter_column('audit_log', 'username',
               existing_type=sa.VARCHAR(length=150),
               nullable=True)
    # ### end Alembic commands ###


def downgrade() -> None:
    op.alter_column('audit_log', 'username',
               existing_type=sa.VARCHAR(length=150),
               nullable=False)
    op.alter_column('audit_log', 'user_id',
               existing_type=sa.UUID(),
               nullable=False)
    # ### end Alembic commands ###
