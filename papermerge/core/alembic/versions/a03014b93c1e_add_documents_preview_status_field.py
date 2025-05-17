"""add documents.preview_status and documents.preview_error fields

Revision ID: a03014b93c1e
Revises: 2118951c4d90
Create Date: 2025-05-12 07:25:19.171857

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "a03014b93c1e"
down_revision: Union[str, None] = "2118951c4d90"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("documents", sa.Column("preview_status", sa.String(), nullable=True))
    op.add_column("documents", sa.Column("preview_error", sa.String(), nullable=True))


def downgrade() -> None:
    op.drop_column("documents", "preview_error")
    op.drop_column("documents", "preview_status")
