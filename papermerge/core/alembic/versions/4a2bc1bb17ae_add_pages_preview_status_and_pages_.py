"""add pages.preview_status and pages.preview_error fields

Revision ID: 4a2bc1bb17ae
Revises: a03014b93c1e
Create Date: 2025-05-18 06:13:52.432952

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from papermerge.core.constants import ImagePreviewStatus


# revision identifiers, used by Alembic.
revision: str = "4a2bc1bb17ae"
down_revision: Union[str, None] = "a03014b93c1e"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    preview_status_enum = sa.Enum(ImagePreviewStatus, name="preview_status")
    preview_status_enum.create(op.get_bind())
    op.add_column(
        "pages",
        sa.Column(
            "preview_status",
            preview_status_enum,
            nullable=True,
        ),
    )
    op.add_column(
        "pages",
        sa.Column(
            "preview_error",
            sa.String(),
            nullable=True,
        ),
    )


def downgrade() -> None:
    op.drop_column("pages", "preview_error")
    op.drop_column("pages", "preview_status")
