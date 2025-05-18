"""update documents.preview_status type as pg enum

Revision ID: 1240862ec13d
Revises: 4a2bc1bb17ae
Create Date: 2025-05-18 06:25:33.643203

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "1240862ec13d"
down_revision: Union[str, None] = "4a2bc1bb17ae"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.drop_column("documents", "preview_status")
    op.add_column(
        "documents",
        sa.Column(
            "preview_status",
            sa.Enum("READY", "PENDING", "FAILED", name="preview_status"),
            nullable=True,
        ),
    )


def downgrade() -> None:
    pass
