"""v3.6.0: 0015 add triggers for home/inbox folders validation

Revision ID: 8235f6e5cbb2
Revises: 6a88d61a7c74
Create Date: 2025-10-12 08:08:38.968172

This migration adds database triggers to enforce business rules:
1. Users must always have exactly one home and one inbox folder
2. Special folders cannot be deleted while the owner exists
"""
from typing import Sequence, Union
from pathlib import Path

from alembic import op

# revision identifiers, used by Alembic.
revision: str = '8235f6e5cbb2'
down_revision: Union[str, None] = '6a88d61a7c74'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def get_sql_file_content(filename: str) -> str:
    """Load SQL file from the sql directory"""
    sql_dir = Path(__file__).parent.parent / 'sql'
    sql_file = sql_dir / filename

    if not sql_file.exists():
        raise FileNotFoundError(f"SQL file not found: {sql_file}")

    return sql_file.read_text(encoding='utf-8')


def upgrade() -> None:
    """
    Add triggers to enforce special folders business rules:
    - Users must have exactly one home and one inbox folder
    - Special folders cannot be deleted while owner exists
    """
    print("Creating special folders constraints...")

    # Load and execute the trigger creation SQL
    trigger_sql = get_sql_file_content('special_folders_triggers_up.sql')
    op.execute(trigger_sql)

    print("✓ Special folders constraints added successfully")


def downgrade() -> None:
    """Remove special folders constraints"""
    print("Removing special folders constraints...")

    # Load and execute the trigger removal SQL
    trigger_sql = get_sql_file_content('special_folders_triggers_down.sql')
    op.execute(trigger_sql)

    print("✓ Special folders constraints removed successfully")
