"""Created By/Updated By NOT NULL

Revision ID: 00afb069c2b1
Revises: a07f7fbbcca8
Create Date: 2025-12-25 06:03:50.316594

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '00afb069c2b1'
down_revision: Union[str, None] = 'a07f7fbbcca8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

SYSTEM_USER_ID = "00000000-0000-0000-0000-000000000000"

def upgrade() -> None:
    op.execute(f"""
        INSERT INTO users (
            id, username, email, password,
            is_superuser, is_staff, is_active,
            created_at, updated_at, date_joined
        )
        VALUES (
            '{SYSTEM_USER_ID}', 'system', 'system@local', '-',
            true, false, false,
            NOW(), NOW(), NOW()
        )
        ON CONFLICT (id) DO NOTHING
    """)

    # Backfill NULLs with system user
    tables = [
        'custom_fields', 'document_types', 'document_versions',
        'groups', 'nodes', 'roles', 'shared_nodes', 'tags',
        'users_groups', 'users_roles'
    ]

    for table in tables:
        op.execute(f"""
            UPDATE {table}
            SET created_by = '{SYSTEM_USER_ID}'
            WHERE created_by IS NULL
        """)
        op.execute(f"""
            UPDATE {table}
            SET updated_by = '{SYSTEM_USER_ID}'
            WHERE updated_by IS NULL
        """)

    op.alter_column('custom_fields', 'created_by',
               existing_type=sa.UUID(),
               nullable=False)
    op.alter_column('custom_fields', 'updated_by',
               existing_type=sa.UUID(),
               nullable=False)
    op.alter_column('document_types', 'created_by',
               existing_type=sa.UUID(),
               nullable=False)
    op.alter_column('document_types', 'updated_by',
               existing_type=sa.UUID(),
               nullable=False)
    op.alter_column('document_versions', 'created_by',
               existing_type=sa.UUID(),
               nullable=False)
    op.alter_column('document_versions', 'updated_by',
               existing_type=sa.UUID(),
               nullable=False)
    op.alter_column('groups', 'created_by',
               existing_type=sa.UUID(),
               nullable=False)
    op.alter_column('groups', 'updated_by',
               existing_type=sa.UUID(),
               nullable=False)
    op.alter_column('nodes', 'created_by',
               existing_type=sa.UUID(),
               nullable=False)
    op.alter_column('nodes', 'updated_by',
               existing_type=sa.UUID(),
               nullable=False)
    op.alter_column('roles', 'created_by',
               existing_type=sa.UUID(),
               nullable=False)
    op.alter_column('roles', 'updated_by',
               existing_type=sa.UUID(),
               nullable=False)
    op.alter_column('shared_nodes', 'created_by',
               existing_type=sa.UUID(),
               nullable=False)
    op.alter_column('shared_nodes', 'updated_by',
               existing_type=sa.UUID(),
               nullable=False)
    op.alter_column('tags', 'created_by',
               existing_type=sa.UUID(),
               nullable=False)
    op.alter_column('tags', 'updated_by',
               existing_type=sa.UUID(),
               nullable=False)
    op.alter_column('users_groups', 'created_by',
               existing_type=sa.UUID(),
               nullable=False)
    op.alter_column('users_groups', 'updated_by',
               existing_type=sa.UUID(),
               nullable=False)
    op.alter_column('users_roles', 'created_by',
               existing_type=sa.UUID(),
               nullable=False)
    op.alter_column('users_roles', 'updated_by',
               existing_type=sa.UUID(),
               nullable=False)


def downgrade() -> None:
    op.alter_column('users_roles', 'updated_by',
               existing_type=sa.UUID(),
               nullable=True)
    op.alter_column('users_roles', 'created_by',
               existing_type=sa.UUID(),
               nullable=True)
    op.alter_column('users_groups', 'updated_by',
               existing_type=sa.UUID(),
               nullable=True)
    op.alter_column('users_groups', 'created_by',
               existing_type=sa.UUID(),
               nullable=True)
    op.alter_column('tags', 'updated_by',
               existing_type=sa.UUID(),
               nullable=True)
    op.alter_column('tags', 'created_by',
               existing_type=sa.UUID(),
               nullable=True)
    op.alter_column('shared_nodes', 'updated_by',
               existing_type=sa.UUID(),
               nullable=True)
    op.alter_column('shared_nodes', 'created_by',
               existing_type=sa.UUID(),
               nullable=True)
    op.alter_column('roles', 'updated_by',
               existing_type=sa.UUID(),
               nullable=True)
    op.alter_column('roles', 'created_by',
               existing_type=sa.UUID(),
               nullable=True)
    op.alter_column('nodes', 'updated_by',
               existing_type=sa.UUID(),
               nullable=True)
    op.alter_column('nodes', 'created_by',
               existing_type=sa.UUID(),
               nullable=True)
    op.alter_column('groups', 'updated_by',
               existing_type=sa.UUID(),
               nullable=True)
    op.alter_column('groups', 'created_by',
               existing_type=sa.UUID(),
               nullable=True)
    op.alter_column('document_versions', 'updated_by',
               existing_type=sa.UUID(),
               nullable=True)
    op.alter_column('document_versions', 'created_by',
               existing_type=sa.UUID(),
               nullable=True)
    op.alter_column('document_types', 'updated_by',
               existing_type=sa.UUID(),
               nullable=True)
    op.alter_column('document_types', 'created_by',
               existing_type=sa.UUID(),
               nullable=True)
    op.alter_column('custom_fields', 'updated_by',
               existing_type=sa.UUID(),
               nullable=True)
    op.alter_column('custom_fields', 'created_by',
               existing_type=sa.UUID(),
               nullable=True)
