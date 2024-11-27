"""add value_yearmonth and value_year columns to custom_field_values

Revision ID: cea868700f4e
Revises: 85fda75f19f1
Create Date: 2024-11-27 07:30:19.631965

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "cea868700f4e"
down_revision: Union[str, None] = "85fda75f19f1"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "custom_field_values", sa.Column("value_yearmonth", sa.Float(), nullable=True)
    )


def downgrade() -> None:
    op.drop_column("custom_field_values", "value_yearmonth")
