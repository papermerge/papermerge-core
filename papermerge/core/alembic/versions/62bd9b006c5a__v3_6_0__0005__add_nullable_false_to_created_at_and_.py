"""v3.6.0: 0005 -- add nullable=False to created_at and updated_at

Revision ID: 62bd9b006c5a
Revises: 93c83c34d446
Create Date: 2025-08-20 08:04:42.970804

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '62bd9b006c5a'
down_revision: Union[str, None] = '93c83c34d446'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

table_names = [
    "nodes",
    "document_versions",
    "custom_fields",
    "document_types",
    "shared_nodes",
    "tags",
    "roles",
    "users",
    "groups"
]

def upgrade() -> None:
    for table_name in table_names:
        op.alter_column(
            table_name,
            "created_at",
            existing_type=sa.TIMESTAMP(timezone=True),
            nullable=False,
            # value is inserted in Python/application level
            server_default=None
        )
        op.alter_column(
            table_name,
            "updated_at",
            existing_type=sa.TIMESTAMP(timezone=True),
            nullable=False,
            # value is inserted in Python/application level
            server_default=None
        )


def downgrade() -> None:
    for table_name in table_names:
        op.alter_column(
            table_name,
            "created_at",
            existing_type=sa.TIMESTAMP(timezone=True),
            nullable=True,
            existing_server_default=sa.text("now()")
        )
        op.alter_column(
            table_name,
            "updated_at",
            existing_type=sa.TIMESTAMP(timezone=True),
            nullable=True,
            existing_server_default=sa.text("now()")
        )
