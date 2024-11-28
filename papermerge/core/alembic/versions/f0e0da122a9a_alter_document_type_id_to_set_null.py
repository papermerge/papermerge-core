"""Alter document_type_id ondelete='SET NUll'

Revision ID: f0e0da122a9a
Revises: cea868700f4e
Create Date: 2024-11-28 07:03:02.949518

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "f0e0da122a9a"
down_revision: Union[str, None] = "cea868700f4e"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    with op.batch_alter_table("documents") as batch_op:
        batch_op.drop_constraint("documents_document_type_id_fkey", type_="foreignkey")
        batch_op.create_foreign_key(
            "documents_document_type_id_fkey",
            "document_types",
            ["document_type_id"],
            ["id"],
            ondelete="SET NULL",
        )


def downgrade() -> None:
    with op.batch_alter_table("documents") as batch_op:
        batch_op.drop_constraint(None, type_="foreignkey")
        batch_op.create_foreign_key(
            "documents_document_type_id_fkey",
            "document_types",
            ["document_type_id"],
            ["id"],
        )
