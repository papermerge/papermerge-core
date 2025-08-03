"""v3.5.3: 0002 - Set home_folder_id and inbox_folder_id to NOT NULL

Revision ID: ad7145f8e1d5
Revises: 4756d6d67b0d
Create Date: 2025-08-02 07:31:51.080201

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'ad7145f8e1d5'
down_revision: Union[str, None] = '4756d6d67b0d'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Set `home_folder_id` and `inbox_folder_id` to NOT NULL"""
    op.alter_column('users', 'home_folder_id',
                    existing_type=sa.UUID(),
                    nullable=False,
                    existing_nullable=True,
                    existing_server_default=None)

    op.alter_column('users', 'inbox_folder_id',
                    existing_type=sa.UUID(),
                    nullable=False,
                    existing_nullable=True,
                    existing_server_default=None)


def downgrade() -> None:
    op.alter_column('users', 'home_folder_id',
                    existing_type=sa.UUID(),
                    nullable=True,
                    existing_nullable=False,
                    existing_server_default=None)

    op.alter_column('users', 'inbox_folder_id',
                    existing_type=sa.UUID(),
                    nullable=True,
                    existing_nullable=False,
                    existing_server_default=None)
