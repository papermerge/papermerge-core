"""v3.6.0: 0010 -- make role name partially unique

Revision ID: 2a80c098267f
Revises: 1e2e365bb8c4
Create Date: 2025-09-08 06:08:00.481068

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '2a80c098267f'
down_revision: Union[str, None] = '1e2e365bb8c4'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.drop_constraint('roles_name_key', 'roles', type_='unique')
    op.create_index('idx_roles_name_active_unique', 'roles', ['name'], unique=True, postgresql_where=sa.text('deleted_at IS NULL'))


def downgrade() -> None:
    op.drop_index('idx_roles_name_active_unique', table_name='roles', postgresql_where=sa.text('deleted_at IS NULL'))
    op.create_unique_constraint('roles_name_key', 'roles', ['name'])
