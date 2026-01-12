"""convert_mime_type_to_string

Revision ID: bb19aac50bca
Revises: fa71c2c795a9
Create Date: 2026-01-12 08:04:16.417598

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = 'bb19aac50bca'
down_revision: Union[str, None] = 'fa71c2c795a9'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Step 1: Add a new temporary column as String
    op.add_column(
        'document_versions',
        sa.Column('mime_type_new', sa.String(), nullable=True)
    )

    # Step 2: Migrate data from enum to string with proper format
    op.execute("""
        UPDATE document_versions
        SET mime_type_new = CASE mime_type::text
            WHEN 'application_pdf' THEN 'application/pdf'
            WHEN 'image_jpeg' THEN 'image/jpeg'
            WHEN 'image_png' THEN 'image/png'
            WHEN 'image_tiff' THEN 'image/tiff'
        END
    """)

    # Step 3: Drop the old mime_type column
    op.drop_column('document_versions', 'mime_type')

    # Step 4: Rename the new column to mime_type
    op.alter_column(
        'document_versions',
        'mime_type_new',
        new_column_name='mime_type'
    )

    # Step 5: Make the column non-nullable
    op.alter_column(
        'document_versions',
        'mime_type',
        existing_type=sa.String(),
        nullable=False
    )

    # Step 6: Drop the enum type
    op.execute("DROP TYPE IF EXISTS document_version_mime_type")


def downgrade() -> None:
    # Step 1: Recreate the enum type
    mime_type_enum = postgresql.ENUM(
        'application_pdf',
        'image_jpeg',
        'image_png',
        'image_tiff',
        name='document_version_mime_type',
        create_type=True
    )
    mime_type_enum.create(op.get_bind(), checkfirst=True)

    # Step 2: Add a new temporary column as enum
    op.add_column(
        'document_versions',
        sa.Column(
            'mime_type_new',
            mime_type_enum,
            nullable=True
        )
    )

    # Step 3: Migrate data from string back to enum
    op.execute("""
        UPDATE document_versions
        SET mime_type_new = CASE mime_type
            WHEN 'application/pdf' THEN 'application_pdf'::document_version_mime_type
            WHEN 'image/jpeg' THEN 'image_jpeg'::document_version_mime_type
            WHEN 'image/png' THEN 'image_png'::document_version_mime_type
            WHEN 'image/tiff' THEN 'image_tiff'::document_version_mime_type
        END
    """)

    # Step 4: Drop the old string column
    op.drop_column('document_versions', 'mime_type')

    # Step 5: Rename the new column to mime_type
    op.alter_column(
        'document_versions',
        'mime_type_new',
        new_column_name='mime_type'
    )

    # Step 6: Make the column non-nullable
    op.alter_column(
        'document_versions',
        'mime_type',
        existing_type=mime_type_enum,
        nullable=False
    )
