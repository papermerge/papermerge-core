"""v3.6.0: 0010 -- soft delete for roles and users_roles tables

Revision ID: 1e2e365bb8c4
Revises: 20dbc0432ab9
Create Date: 2025-09-07 09:38:15.901309
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '1e2e365bb8c4'
down_revision: Union[str, None] = '20dbc0432ab9'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_foreign_key(None, 'custom_fields', 'users', ['created_by'], ['id'], ondelete='SET NULL')
    op.create_foreign_key(None, 'custom_fields', 'users', ['deleted_by'], ['id'], ondelete='SET NULL')
    op.create_foreign_key(None, 'custom_fields', 'users', ['updated_by'], ['id'], ondelete='SET NULL')
    op.create_foreign_key(None, 'custom_fields', 'users', ['archived_by'], ['id'], ondelete='SET NULL')
    op.create_foreign_key(None, 'document_types', 'users', ['deleted_by'], ['id'], ondelete='SET NULL')
    op.create_foreign_key(None, 'document_types', 'users', ['archived_by'], ['id'], ondelete='SET NULL')
    op.create_foreign_key(None, 'document_types', 'users', ['created_by'], ['id'], ondelete='SET NULL')
    op.create_foreign_key(None, 'document_types', 'users', ['updated_by'], ['id'], ondelete='SET NULL')
    op.create_foreign_key(None, 'document_versions', 'users', ['archived_by'], ['id'], ondelete='SET NULL')
    op.create_foreign_key(None, 'document_versions', 'users', ['deleted_by'], ['id'], ondelete='SET NULL')
    op.create_foreign_key(None, 'document_versions', 'users', ['created_by'], ['id'], ondelete='SET NULL')
    op.create_foreign_key(None, 'document_versions', 'users', ['updated_by'], ['id'], ondelete='SET NULL')
    op.create_foreign_key(None, 'groups', 'users', ['deleted_by'], ['id'], ondelete='SET NULL')
    op.create_foreign_key(None, 'groups', 'users', ['updated_by'], ['id'], ondelete='SET NULL')
    op.create_foreign_key(None, 'groups', 'users', ['archived_by'], ['id'], ondelete='SET NULL')
    op.create_foreign_key(None, 'groups', 'users', ['created_by'], ['id'], ondelete='SET NULL')
    op.create_foreign_key(None, 'nodes', 'users', ['archived_by'], ['id'], ondelete='SET NULL')
    op.create_foreign_key(None, 'nodes', 'users', ['deleted_by'], ['id'], ondelete='SET NULL')
    op.create_foreign_key(None, 'nodes', 'users', ['created_by'], ['id'], ondelete='SET NULL')
    op.create_foreign_key(None, 'nodes', 'users', ['updated_by'], ['id'], ondelete='SET NULL')
    op.create_foreign_key(None, 'roles', 'users', ['deleted_by'], ['id'], ondelete='SET NULL')
    op.create_foreign_key(None, 'roles', 'users', ['updated_by'], ['id'], ondelete='SET NULL')
    op.create_foreign_key(None, 'roles', 'users', ['created_by'], ['id'], ondelete='SET NULL')
    op.create_foreign_key(None, 'roles', 'users', ['archived_by'], ['id'], ondelete='SET NULL')
    op.drop_constraint('shared_nodes_role_id_fkey', 'shared_nodes', type_='foreignkey')
    op.create_foreign_key(None, 'shared_nodes', 'users', ['created_by'], ['id'], ondelete='SET NULL')
    op.create_foreign_key('shared_nodes_role_id_fkey', 'shared_nodes', 'roles', ['role_id'], ['id'], use_alter=True)
    op.create_foreign_key(None, 'shared_nodes', 'users', ['deleted_by'], ['id'], ondelete='SET NULL')
    op.create_foreign_key(None, 'shared_nodes', 'users', ['archived_by'], ['id'], ondelete='SET NULL')
    op.create_foreign_key(None, 'shared_nodes', 'users', ['updated_by'], ['id'], ondelete='SET NULL')
    op.create_foreign_key(None, 'tags', 'users', ['deleted_by'], ['id'], ondelete='SET NULL')
    op.create_foreign_key(None, 'tags', 'users', ['archived_by'], ['id'], ondelete='SET NULL')
    op.create_foreign_key(None, 'tags', 'users', ['updated_by'], ['id'], ondelete='SET NULL')
    op.create_foreign_key(None, 'tags', 'users', ['created_by'], ['id'], ondelete='SET NULL')
    op.alter_column('users', 'updated_at',
               existing_type=postgresql.TIMESTAMP(),
               type_=postgresql.TIMESTAMP(timezone=True),
               existing_nullable=False)
    op.create_foreign_key(None, 'users', 'users', ['archived_by'], ['id'], ondelete='SET NULL')
    op.create_foreign_key(None, 'users', 'users', ['deleted_by'], ['id'], ondelete='SET NULL')
    op.create_foreign_key(None, 'users', 'users', ['created_by'], ['id'], ondelete='SET NULL')
    op.create_foreign_key(None, 'users', 'users', ['updated_by'], ['id'], ondelete='SET NULL')

    op.add_column('users_roles', sa.Column('id', sa.Uuid(), nullable=False, server_default=sa.text('gen_random_uuid()')))
    op.create_primary_key('users_roles_pkey', 'users_roles', ['id'])
    op.add_column('users_roles', sa.Column('created_at', postgresql.TIMESTAMP(timezone=True), nullable=False, server_default=sa.func.now()))
    op.add_column('users_roles', sa.Column('updated_at', postgresql.TIMESTAMP(timezone=True), nullable=False, server_default=sa.func.now()))
    op.add_column('users_roles', sa.Column('deleted_at', postgresql.TIMESTAMP(timezone=True), nullable=True))
    op.add_column('users_roles', sa.Column('archived_at', postgresql.TIMESTAMP(timezone=True), nullable=True))
    op.add_column('users_roles', sa.Column('created_by', sa.Uuid(), nullable=True))
    op.add_column('users_roles', sa.Column('updated_by', sa.Uuid(), nullable=True))
    op.add_column('users_roles', sa.Column('deleted_by', sa.Uuid(), nullable=True))
    op.add_column('users_roles', sa.Column('archived_by', sa.Uuid(), nullable=True))
    op.alter_column('users_roles', 'role_id',
               existing_type=sa.UUID(),
               nullable=False)
    op.alter_column('users_roles', 'user_id',
               existing_type=sa.UUID(),
               nullable=False)
    op.create_foreign_key(None, 'users_roles', 'users', ['deleted_by'], ['id'], ondelete='SET NULL')
    op.create_foreign_key(None, 'users_roles', 'users', ['archived_by'], ['id'], ondelete='SET NULL')
    op.create_foreign_key(None, 'users_roles', 'users', ['created_by'], ['id'], ondelete='SET NULL')
    op.create_foreign_key(None, 'users_roles', 'users', ['updated_by'], ['id'], ondelete='SET NULL')


def downgrade() -> None:
    op.drop_constraint(None, 'users_roles', type_='foreignkey')
    op.drop_constraint(None, 'users_roles', type_='foreignkey')
    op.drop_constraint(None, 'users_roles', type_='foreignkey')
    op.drop_constraint(None, 'users_roles', type_='foreignkey')
    op.alter_column('users_roles', 'user_id',
               existing_type=sa.UUID(),
               nullable=True)
    op.alter_column('users_roles', 'role_id',
               existing_type=sa.UUID(),
               nullable=True)
    op.drop_column('users_roles', 'archived_by')
    op.drop_column('users_roles', 'deleted_by')
    op.drop_column('users_roles', 'updated_by')
    op.drop_column('users_roles', 'created_by')
    op.drop_column('users_roles', 'archived_at')
    op.drop_column('users_roles', 'deleted_at')
    op.drop_column('users_roles', 'updated_at')
    op.drop_column('users_roles', 'created_at')
    op.drop_column('users_roles', 'id')
    op.drop_constraint(None, 'users', type_='foreignkey')
    op.drop_constraint(None, 'users', type_='foreignkey')
    op.drop_constraint(None, 'users', type_='foreignkey')
    op.drop_constraint(None, 'users', type_='foreignkey')
    op.alter_column('users', 'updated_at',
               existing_type=postgresql.TIMESTAMP(timezone=True),
               type_=postgresql.TIMESTAMP(),
               existing_nullable=False)
    op.drop_constraint(None, 'tags', type_='foreignkey')
    op.drop_constraint(None, 'tags', type_='foreignkey')
    op.drop_constraint(None, 'tags', type_='foreignkey')
    op.drop_constraint(None, 'tags', type_='foreignkey')
    op.drop_constraint(None, 'shared_nodes', type_='foreignkey')
    op.drop_constraint(None, 'shared_nodes', type_='foreignkey')
    op.drop_constraint(None, 'shared_nodes', type_='foreignkey')
    op.drop_constraint('shared_nodes_role_id_fkey', 'shared_nodes', type_='foreignkey')
    op.drop_constraint(None, 'shared_nodes', type_='foreignkey')
    op.create_foreign_key('shared_nodes_role_id_fkey', 'shared_nodes', 'roles', ['role_id'], ['id'], ondelete='CASCADE')
    op.drop_constraint(None, 'roles', type_='foreignkey')
    op.drop_constraint(None, 'roles', type_='foreignkey')
    op.drop_constraint(None, 'roles', type_='foreignkey')
    op.drop_constraint(None, 'roles', type_='foreignkey')
    op.drop_constraint(None, 'nodes', type_='foreignkey')
    op.drop_constraint(None, 'nodes', type_='foreignkey')
    op.drop_constraint(None, 'nodes', type_='foreignkey')
    op.drop_constraint(None, 'nodes', type_='foreignkey')
    op.drop_constraint(None, 'groups', type_='foreignkey')
    op.drop_constraint(None, 'groups', type_='foreignkey')
    op.drop_constraint(None, 'groups', type_='foreignkey')
    op.drop_constraint(None, 'groups', type_='foreignkey')
    op.drop_constraint(None, 'document_versions', type_='foreignkey')
    op.drop_constraint(None, 'document_versions', type_='foreignkey')
    op.drop_constraint(None, 'document_versions', type_='foreignkey')
    op.drop_constraint(None, 'document_versions', type_='foreignkey')
    op.drop_constraint(None, 'document_types', type_='foreignkey')
    op.drop_constraint(None, 'document_types', type_='foreignkey')
    op.drop_constraint(None, 'document_types', type_='foreignkey')
    op.drop_constraint(None, 'document_types', type_='foreignkey')
    op.drop_constraint(None, 'custom_fields', type_='foreignkey')
    op.drop_constraint(None, 'custom_fields', type_='foreignkey')
    op.drop_constraint(None, 'custom_fields', type_='foreignkey')
    op.drop_constraint(None, 'custom_fields', type_='foreignkey')
