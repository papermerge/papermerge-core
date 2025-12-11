"""add position column to cf association

Revision ID: a07f7fbbcca8
Revises: d835ab430541
Create Date: 2025-12-11 06:08:22.702424

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = 'a07f7fbbcca8'
down_revision: Union[str, None] = 'd835ab430541'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Step 1: Add column as nullable first
    op.add_column(
        'document_types_custom_fields',
        sa.Column('position', sa.Integer(), nullable=True)
    )

    # Step 2: Data migration - set sequential positions per document type
    # Using raw SQL with window function for efficiency
    op.execute("""
        UPDATE document_types_custom_fields
        SET position = subquery.new_position
        FROM (
            SELECT
                id,
                ROW_NUMBER() OVER (
                    PARTITION BY document_type_id
                    ORDER BY id
                ) - 1 AS new_position
            FROM document_types_custom_fields
        ) AS subquery
        WHERE document_types_custom_fields.id = subquery.id
    """)

    # Step 3: Make column non-nullable after data is populated
    op.alter_column(
        'document_types_custom_fields',
        'position',
        nullable=False
    )


def downgrade() -> None:
    op.drop_column('document_types_custom_fields', 'position')
