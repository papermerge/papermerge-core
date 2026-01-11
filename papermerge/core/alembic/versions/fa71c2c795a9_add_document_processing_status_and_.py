"""add document processing status and version lineage

Revision ID: fa71c2c795a9
Revises: c1fa0c57ba3e
Create Date: 2026-01-11 08:20:20.373077

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'fa71c2c795a9'
down_revision: Union[str, None] = 'c1fa0c57ba3e'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None



def upgrade() -> None:
    # Create the processing status enum type
    document_processing_status_enum = postgresql.ENUM(
        'uploaded',
        'converting',
        'processing_pages',
        'ready',
        'failed',
        name='document_processing_status',
        create_type=True
    )
    document_processing_status_enum.create(op.get_bind(), checkfirst=True)

    # Add processing_status column to documents table
    op.add_column(
        'documents',
        sa.Column(
            'processing_status',
            document_processing_status_enum,
            nullable=True  # Temporarily nullable for migration
        )
    )

    # Add processing_error column to documents table
    op.add_column(
        'documents',
        sa.Column('processing_error', sa.String(), nullable=True)
    )

    # Add is_original column to document_versions table
    op.add_column(
        'document_versions',
        sa.Column('is_original', sa.Boolean(), nullable=True)
    )

    # Add source_version_id column to document_versions table
    op.add_column(
        'document_versions',
        sa.Column('source_version_id', sa.UUID(), nullable=True)
    )

    # Add creation_reason column to document_versions table
    op.add_column(
        'document_versions',
        sa.Column('creation_reason', sa.String(), nullable=True)
    )

    # Create foreign key constraint for source_version_id
    op.create_foreign_key(
        'fk_document_versions_source_version_id',
        'document_versions',
        'document_versions',
        ['source_version_id'],
        ['id'],
        ondelete='SET NULL'
    )

    # ============================================================
    # DATA MIGRATION
    # ============================================================

    # Temporarily disable triggers to avoid "pending trigger events" error
    # This allows us to UPDATE rows and then ALTER TABLE in same transaction
    op.execute("SET session_replication_role = replica;")

    # Set default values for existing data

    # 1. Set all existing documents to 'ready' status
    #    (they're already processed since they exist)
    op.execute("""
        UPDATE documents
        SET processing_status = 'ready'
        WHERE processing_status IS NULL
    """)

    # 2. Mark version 1 as original for all documents
    op.execute("""
        UPDATE document_versions
        SET is_original = TRUE
        WHERE number = 1
    """)

    # 3. Mark other versions as not original
    op.execute("""
        UPDATE document_versions
        SET is_original = FALSE
        WHERE number > 1
    """)

    # 4. Set creation_reason for version 1 (original upload)
    op.execute("""
        UPDATE document_versions
        SET creation_reason = 'upload'
        WHERE number = 1
    """)

    # 5. Set creation_reason for version 2+
    #    If short_description contains '->' it's likely a conversion
    op.execute("""
        UPDATE document_versions
        SET creation_reason = CASE
            WHEN short_description LIKE '%->%' THEN 'conversion'
            ELSE 'page_edit'
        END
        WHERE number > 1 AND creation_reason IS NULL
    """)

    # 6. Link version 2+ to their source (version 1 of same document)
    #    This assumes linear version history (2 derived from 1, 3 from 2, etc.)
    op.execute("""
        UPDATE document_versions v2
        SET source_version_id = v1.id
        FROM document_versions v1
        WHERE v2.document_id = v1.document_id
          AND v2.number = v1.number + 1
          AND v2.source_version_id IS NULL
    """)

    # Re-enable triggers
    op.execute("SET session_replication_role = DEFAULT;")

    # ============================================================
    # MAKE COLUMNS NON-NULLABLE
    # ============================================================

    # Make processing_status non-nullable now that all rows have values
    op.alter_column(
        'documents',
        'processing_status',
        existing_type=document_processing_status_enum,
        nullable=False,
        server_default='uploaded'
    )

    # Make is_original non-nullable
    op.alter_column(
        'document_versions',
        'is_original',
        existing_type=sa.Boolean(),
        nullable=False,
        server_default='false'
    )

    # Make creation_reason non-nullable
    op.alter_column(
        'document_versions',
        'creation_reason',
        existing_type=sa.String(),
        nullable=False,
        server_default='upload'
    )


def downgrade() -> None:
    # Drop foreign key constraint
    op.drop_constraint(
        'fk_document_versions_source_version_id',
        'document_versions',
        type_='foreignkey'
    )

    # Drop columns from document_versions
    op.drop_column('document_versions', 'creation_reason')
    op.drop_column('document_versions', 'source_version_id')
    op.drop_column('document_versions', 'is_original')

    # Drop columns from documents
    op.drop_column('documents', 'processing_error')
    op.drop_column('documents', 'processing_status')

    # Drop the enum type
    document_processing_status_enum = postgresql.ENUM(
        'uploaded',
        'converting',
        'processing_pages',
        'ready',
        'failed',
        name='document_processing_status'
    )
    document_processing_status_enum.drop(op.get_bind(), checkfirst=True)
