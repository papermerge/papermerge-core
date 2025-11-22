"""make mime_type column non null

Revision ID: f4100d4bccd7
Revises: 461e410f7eba
Create Date: 2025-11-21 08:13:27.406572

"""
from typing import Sequence, Union

from alembic import op
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'f4100d4bccd7'
down_revision: Union[str, None] = '461e410f7eba'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Step 1: Update all existing NULL mime_type values to 'application_pdf'
    op.execute("""
        UPDATE document_versions
        SET mime_type = 'application_pdf'
        WHERE mime_type IS NULL
    """)

    # Step 2: Make the column non-nullable
    op.alter_column('document_versions', 'mime_type',
               existing_type=postgresql.ENUM('application_pdf', 'image_jpeg', 'image_png', 'image_tiff', name='document_version_mime_type'),
               nullable=False)


def downgrade() -> None:
    # Make nullable again (doesn't restore NULL values, just allows them)
    op.alter_column('document_versions', 'mime_type',
               existing_type=postgresql.ENUM('application_pdf', 'image_jpeg', 'image_png', 'image_tiff', name='document_version_mime_type'),
               nullable=True)
