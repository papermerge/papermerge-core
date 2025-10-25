"""document search index

Revision ID: 461e410f7eba
Revises: 45b268a785c2
Create Date: 2025-10-25 10:17:18.089928

"""
from typing import Sequence, Union
from pathlib import Path

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '461e410f7eba'
down_revision: Union[str, None] = '45b268a785c2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

SQL_FOLDER = Path(__file__).parent.parent.parent / "features" / "search" / "db" / "sql"

def upgrade() -> None:
    # Create table
    op.create_table(
        'document_search_index',
        sa.Column('document_id', sa.Uuid(), nullable=False),
        sa.Column('document_type_id', sa.Uuid(), nullable=True),
        sa.Column('owner_type', sa.String(length=20), nullable=False),
        sa.Column('owner_id', sa.Uuid(), nullable=False),
        sa.Column('lang', sa.String(length=10), nullable=False, server_default='en'),  # ← FIXED
        sa.Column('title', sa.String(), nullable=True),
        sa.Column('document_type_name', sa.String(), nullable=True),
        sa.Column('tags', postgresql.ARRAY(sa.String()), nullable=True),
        sa.Column('custom_fields_text', sa.String(), nullable=True),
        sa.Column('search_vector', postgresql.TSVECTOR(), nullable=False),
        sa.Column('last_updated', sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.func.now()),  # ← Also add this
        sa.ForeignKeyConstraint(['document_id'], ['documents.node_id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['document_type_id'], ['document_types.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('document_id')
    )

    # Create indexes
    op.create_index(
        'idx_document_search_doc_type',
        'document_search_index',
        ['document_type_id'],
        unique=False
    )
    op.create_index(
        'idx_document_search_lang',
        'document_search_index',
        ['lang'],
        unique=False
    )
    op.create_index(
        'idx_document_search_owner',
        'document_search_index',
        ['owner_type', 'owner_id'],
        unique=False
    )
    op.create_index(
        'idx_document_search_vector',
        'document_search_index',
        ['search_vector'],
        unique=False,
        postgresql_using='gin'
    )
    op.execute(sa.text(open(SQL_FOLDER / 'search_index_functions.sql').read()))
    op.execute(sa.text(open(SQL_FOLDER / 'search_index_triggers.sql').read()))


def downgrade() -> None:
    op.execute(sa.text(open(SQL_FOLDER / 'search_index_triggers_down.sql').read()))
    op.execute(sa.text(open(SQL_FOLDER / 'search_index_functions_down.sql').read()))

    # Drop indexes
    op.drop_index('idx_document_search_vector', table_name='document_search_index', postgresql_using='gin')
    op.drop_index('idx_document_search_owner', table_name='document_search_index')
    op.drop_index('idx_document_search_lang', table_name='document_search_index')
    op.drop_index('idx_document_search_doc_type', table_name='document_search_index')

    # Drop table
    op.drop_table('document_search_index')