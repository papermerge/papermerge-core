"""shared_nodes_schema_improvements

Revision ID: d835ab430541
Revises: f4100d4bccd7
Create Date: 2025-11-29 08:18:20.683384

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = 'd835ab430541'
down_revision: Union[str, None] = 'f4100d4bccd7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_index('idx_shared_nodes_group_id', 'shared_nodes', ['group_id'], unique=False, postgresql_where=sa.text('group_id IS NOT NULL'))
    op.create_index('idx_shared_nodes_group_unique', 'shared_nodes', ['node_id', 'group_id', 'role_id'], unique=True, postgresql_where=sa.text('group_id IS NOT NULL'))
    op.create_index('idx_shared_nodes_node_id', 'shared_nodes', ['node_id'], unique=False)
    op.create_index('idx_shared_nodes_owner_id', 'shared_nodes', ['owner_id'], unique=False)
    op.create_index('idx_shared_nodes_user_id', 'shared_nodes', ['user_id'], unique=False, postgresql_where=sa.text('user_id IS NOT NULL'))
    op.create_index('idx_shared_nodes_user_unique', 'shared_nodes', ['node_id', 'user_id', 'role_id'], unique=True, postgresql_where=sa.text('user_id IS NOT NULL'))
    op.drop_constraint('shared_nodes_role_id_fkey', 'shared_nodes', type_='foreignkey')
    op.create_foreign_key('shared_nodes_role_id_fkey', 'shared_nodes', 'roles', ['role_id'], ['id'], ondelete='CASCADE', use_alter=True)

    # Update check constraint: from OR to XOR logic
    op.drop_constraint('check__user_id_not_null__or__group_id_not_null', 'shared_nodes', type_='check')
    op.create_check_constraint(
        'check__user_id_xor_group_id',
        'shared_nodes',
        "(user_id IS NOT NULL AND group_id IS NULL) OR (user_id IS NULL AND group_id IS NOT NULL)"
    )


def downgrade() -> None:
    # Revert check constraint: from XOR back to OR logic
    op.drop_constraint('check__user_id_xor_group_id', 'shared_nodes', type_='check')
    op.create_check_constraint(
        'check__user_id_not_null__or__group_id_not_null',
        'shared_nodes',
        "user_id IS NOT NULL OR group_id IS NOT NULL"
    )

    op.drop_constraint('shared_nodes_role_id_fkey', 'shared_nodes', type_='foreignkey')
    op.create_foreign_key('shared_nodes_role_id_fkey', 'shared_nodes', 'roles', ['role_id'], ['id'])
    op.drop_index('idx_shared_nodes_user_unique', table_name='shared_nodes', postgresql_where=sa.text('user_id IS NOT NULL'))
    op.drop_index('idx_shared_nodes_user_id', table_name='shared_nodes', postgresql_where=sa.text('user_id IS NOT NULL'))
    op.drop_index('idx_shared_nodes_owner_id', table_name='shared_nodes')
    op.drop_index('idx_shared_nodes_node_id', table_name='shared_nodes')
    op.drop_index('idx_shared_nodes_group_unique', table_name='shared_nodes', postgresql_where=sa.text('group_id IS NOT NULL'))
    op.drop_index('idx_shared_nodes_group_id', table_name='shared_nodes', postgresql_where=sa.text('group_id IS NOT NULL'))
