"""v3.5.3: 0004 -Add non-empty constraint to role name

Revision ID: 50ef5a403d27
Revises: 999b99441bd6
Create Date: 2025-08-08 07:15:35.387426

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '50ef5a403d27'
down_revision: Union[str, None] = '999b99441bd6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_check_constraint(
        "role_name_not_empty_or_whitespace",
        "roles",
        "length(trim(name)) > 0"
    )


def downgrade() -> None:
    op.drop_constraint(
        "role_name_not_empty_or_whitespace",
        "roles",
        type_="check"
    )

