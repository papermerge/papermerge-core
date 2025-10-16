"""title constraint for the folder

Revision ID: 45b268a785c2
Revises: e077d2695f3f
Create Date: 2025-10-16 06:44:12.939335

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '45b268a785c2'
down_revision: Union[str, None] = 'e077d2695f3f'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_index('idx_nodes_unique_folder_title_parent', 'nodes', ['title', 'parent_id'], unique=True, postgresql_where=sa.text("ctype = 'folder'"))


def downgrade() -> None:
    op.drop_index('idx_nodes_unique_folder_title_parent', table_name='nodes', postgresql_where=sa.text("ctype = 'folder'"))
