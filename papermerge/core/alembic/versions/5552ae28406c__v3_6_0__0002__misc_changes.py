"""v3.6.0: 0002 -- misc changes

Revision ID: 5552ae28406c
Revises: 2973d27f1e0d
Create Date: 2025-08-20 06:19:55.752178

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

from papermerge.core.types import MimeType

# revision identifiers, used by Alembic.
revision: str = '5552ae28406c'
down_revision: Union[str, None] = '2973d27f1e0d'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # create pg mime type enum
    doc_ver_mime_type_enum = sa.Enum(MimeType, name="document_version_mime_type")
    doc_ver_mime_type_enum.create(op.get_bind())

    op.drop_column('document_versions', 'mime_type')

    op.add_column(
        'document_versions',
        sa.Column(
            'mime_type',
            sa.Enum(MimeType, name="document_version_mime_type"),
            nullable=True
        )
    )

    op.drop_constraint('nodes_user_id_fkey', 'nodes', type_='foreignkey')
    op.create_foreign_key('nodes_user_id_fkey', 'nodes', 'users', ['user_id'], ['id'], ondelete='CASCADE', deferrable=True, use_alter=True)
    op.create_foreign_key('shared_nodes_group_id_fkey', 'shared_nodes', 'groups', ['group_id'], ['id'], ondelete='CASCADE', use_alter=True)
    op.create_foreign_key('shared_nodes_role_id_fkey', 'shared_nodes', 'roles', ['role_id'], ['id'], ondelete='CASCADE', use_alter=True)
    op.create_foreign_key('shared_nodes_owner_id_fkey', 'shared_nodes', 'users', ['owner_id'], ['id'], ondelete='CASCADE', use_alter=True)
    op.create_foreign_key('shared_nodes_node_id_fkey', 'shared_nodes', 'nodes', ['node_id'], ['id'], ondelete='CASCADE', use_alter=True)
    op.create_foreign_key('shared_nodes_user_id_fkey', 'shared_nodes', 'users', ['user_id'], ['id'], ondelete='CASCADE', use_alter=True)


def downgrade() -> None:
    op.drop_constraint('shared_nodes_user_id_fkey', 'shared_nodes', type_='foreignkey')
    op.drop_constraint('shared_nodes_node_id_fkey', 'shared_nodes', type_='foreignkey')
    op.drop_constraint('shared_nodes_owner_id_fkey', 'shared_nodes', type_='foreignkey')
    op.drop_constraint('shared_nodes_role_id_fkey', 'shared_nodes', type_='foreignkey')
    op.drop_constraint('shared_nodes_group_id_fkey', 'shared_nodes', type_='foreignkey')
    op.drop_constraint('nodes_user_id_fkey', 'nodes', type_='foreignkey')
    op.create_foreign_key('nodes_user_id_fkey', 'nodes', 'users', ['user_id'], ['id'], ondelete='CASCADE', initially='DEFERRED', deferrable=True)
    op.alter_column('document_versions', 'mime_type',
               existing_type=sa.Enum('application_pdf', 'image_jpeg', 'image_png', 'image_tiff', name='document_version_mime_type'),
               type_=sa.INTEGER(),
               existing_nullable=True)

    op.execute("DROP TYPE IF EXISTS document_version_mime_type CASCADE")
