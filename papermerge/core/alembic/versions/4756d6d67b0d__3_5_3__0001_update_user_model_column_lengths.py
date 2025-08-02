"""3.5.3: 0001 - Update user model column lengths

Revision ID: 4756d6d67b0d
Revises: b2350127890a
Create Date: 2025-08-02 07:12:53.145619

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from papermerge.core import constants as const


# revision identifiers, used by Alembic.
revision: str = '4756d6d67b0d'
down_revision: Union[str, None] = 'b2350127890a'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:

    op.alter_column('users', 'email',
                   existing_type=sa.String(),
                   type_=sa.String(const.EMAIL_MAX_LENGTH),
                   existing_nullable=False)

    op.alter_column('users', 'password',
                   existing_type=sa.String(),
                   type_=sa.String(const.PASSWORD_MAX_LENGTH),
                   existing_nullable=False)

    # Update first_name: change length to 100 and make nullable with NULL default
    op.alter_column('users', 'first_name',
                   existing_type=sa.String(),
                   type_=sa.String(const.NAME_MAX_LENGTH),
                   existing_nullable=False,
                   nullable=True,
                   existing_default=' ',
                   server_default=None)

    # Update last_name: change length to 100 and make nullable with NULL default
    op.alter_column('users', 'last_name',
                   existing_type=sa.String(),
                   type_=sa.String(const.NAME_MAX_LENGTH),
                   existing_nullable=False,
                   nullable=True,
                   existing_default=' ',
                   server_default=None)


def downgrade() -> None:

    # Revert first_name: back to unlimited length, not nullable, empty string default
    op.alter_column('users', 'first_name',
                   existing_type=sa.String(const.NAME_MAX_LENGTH),
                   type_=sa.String(),
                   existing_nullable=True,
                   nullable=False,
                   existing_default=None,
                   server_default='')

    # Revert last_name: back to unlimited length, not nullable, empty string default
    op.alter_column('users', 'last_name',
                   existing_type=sa.String(const.NAME_MAX_LENGTH),
                   type_=sa.String(),
                   existing_nullable=True,
                   nullable=False,
                   existing_default=None,
                   server_default='')

    # Revert password column length (assuming it was unlimited before)
    op.alter_column('users', 'password',
                   existing_type=sa.String(const.PASSWORD_MAX_LENGTH),
                   type_=sa.String(),
                   existing_nullable=False)

    # Revert email column length (assuming it was unlimited before)
    op.alter_column('users', 'email',
                   existing_type=sa.String(const.EMAIL_MAX_LENGTH),
                   type_=sa.String(),
                   existing_nullable=False)

