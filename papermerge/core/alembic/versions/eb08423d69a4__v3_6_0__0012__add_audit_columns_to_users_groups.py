"""v3.6.0: 0012 -- add audit columns to users_groups

Revision ID: eb08423d69a4
Revises: 2a80c098267f
Create Date: 2025-09-20 08:42:52.435106

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'eb08423d69a4'
down_revision: Union[str, None] = '2a80c098267f'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.drop_constraint('groups_name_key', 'groups', type_='unique')
    op.create_index('idx_groups_name_active_unique', 'groups', ['name'], unique=True, postgresql_where=sa.text('deleted_at IS NULL'))
    op.add_column('users_groups', sa.Column('id', sa.Uuid(), nullable=False, server_default=sa.text('gen_random_uuid()')))
    op.add_column('users_groups', sa.Column('created_at', postgresql.TIMESTAMP(timezone=True), nullable=False, server_default=sa.text('now()')))
    op.add_column('users_groups', sa.Column('updated_at', postgresql.TIMESTAMP(timezone=True), nullable=False, server_default=sa.text('now()')))
    op.add_column('users_groups', sa.Column('deleted_at', postgresql.TIMESTAMP(timezone=True), nullable=True))
    op.add_column('users_groups', sa.Column('archived_at', postgresql.TIMESTAMP(timezone=True), nullable=True))
    op.add_column('users_groups', sa.Column('created_by', sa.Uuid(), nullable=True))
    op.add_column('users_groups', sa.Column('updated_by', sa.Uuid(), nullable=True))
    op.add_column('users_groups', sa.Column('deleted_by', sa.Uuid(), nullable=True))
    op.add_column('users_groups', sa.Column('archived_by', sa.Uuid(), nullable=True))
    op.alter_column('users_groups', 'group_id',
               existing_type=sa.UUID(),
               nullable=False)
    op.alter_column('users_groups', 'user_id',
               existing_type=sa.UUID(),
               nullable=False)
    op.create_foreign_key(None, 'users_groups', 'users', ['created_by'], ['id'], ondelete='SET NULL')
    op.create_foreign_key(None, 'users_groups', 'users', ['deleted_by'], ['id'], ondelete='SET NULL')
    op.create_foreign_key(None, 'users_groups', 'users', ['archived_by'], ['id'], ondelete='SET NULL')
    op.create_foreign_key(None, 'users_groups', 'users', ['updated_by'], ['id'], ondelete='SET NULL')


def downgrade() -> None:
    op.drop_constraint(None, 'users_groups', type_='foreignkey')
    op.drop_constraint(None, 'users_groups', type_='foreignkey')
    op.drop_constraint(None, 'users_groups', type_='foreignkey')
    op.drop_constraint(None, 'users_groups', type_='foreignkey')
    op.alter_column('users_groups', 'user_id',
               existing_type=sa.UUID(),
               nullable=True)
    op.alter_column('users_groups', 'group_id',
               existing_type=sa.UUID(),
               nullable=True)
    op.drop_column('users_groups', 'archived_by')
    op.drop_column('users_groups', 'deleted_by')
    op.drop_column('users_groups', 'updated_by')
    op.drop_column('users_groups', 'created_by')
    op.drop_column('users_groups', 'archived_at')
    op.drop_column('users_groups', 'deleted_at')
    op.drop_column('users_groups', 'updated_at')
    op.drop_column('users_groups', 'created_at')
    op.drop_column('users_groups', 'id')
    op.drop_index('idx_groups_name_active_unique', table_name='groups', postgresql_where=sa.text('deleted_at IS NULL'))
    op.create_unique_constraint('groups_name_key', 'groups', ['name'])
