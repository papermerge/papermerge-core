"""v3.5.3: 0003 - Set node_user_id foreign key constraint as deferrable

Revision ID: 999b99441bd6
Revises: ad7145f8e1d5
Create Date: 2025-08-02 08:12:35.967662

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '999b99441bd6'
down_revision: Union[str, None] = 'ad7145f8e1d5'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Drop the existing foreign key constraint
    op.drop_constraint('nodes_user_id_fkey', 'nodes', type_='foreignkey')

    # Recreate the foreign key constraint as deferrable and initially deferred
    op.create_foreign_key(
        'nodes_user_id_fkey',
        'nodes',
        'users',
        ['user_id'],
        ['id'],
        ondelete='CASCADE',
        deferrable=True,
        initially='DEFERRED'
    )


def downgrade() -> None:
    op.drop_constraint('nodes_user_id_fkey', 'nodes', type_='foreignkey')

    # Recreate the original foreign key constraint (non-deferrable)
    op.create_foreign_key(
        'nodes_user_id_fkey',
        'nodes',
        'users',
        ['user_id'],
        ['id'],
        ondelete='CASCADE',
        deferrable=False
    )
