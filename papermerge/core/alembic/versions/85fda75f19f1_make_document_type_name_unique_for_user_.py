"""make document type name unique for user_id

Revision ID: 85fda75f19f1
Revises: bc29f69daca4
Create Date: 2024-11-25 10:03:03.516065

"""

from typing import Sequence, Union

from alembic import op


# revision identifiers, used by Alembic.
revision: str = "85fda75f19f1"
down_revision: Union[str, None] = "bc29f69daca4"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    with op.batch_alter_table("document_types") as batch_op:
        batch_op.create_unique_constraint(
            "unique document type per user",
            columns=["name", "user_id"],
        )


def downgrade() -> None:
    with op.batch_alter_table("document_types") as batch_op:
        batch_op.drop_constraint("unique document type per user")
