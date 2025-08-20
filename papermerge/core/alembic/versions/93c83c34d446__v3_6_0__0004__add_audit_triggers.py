"""v3.6.0: 0004 -- Add audit triggers

Revision ID: 93c83c34d446
Revises: 6c5a56286b19
Create Date: 2025-08-20 06:39:54.259769
"""

from typing import Sequence, Union
from pathlib import Path

from alembic import op

# revision identifiers, used by Alembic.
revision: str = '93c83c34d446'
down_revision: Union[str, None] = '6c5a56286b19'
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
    trigger_function_sql = get_sql_file_content('audit_trigger_upgrade.sql')
    op.execute(trigger_function_sql)


def downgrade() -> None:
    trigger_function_sql = get_sql_file_content('audit_trigger_downgrade.sql')
    op.execute(trigger_function_sql)
