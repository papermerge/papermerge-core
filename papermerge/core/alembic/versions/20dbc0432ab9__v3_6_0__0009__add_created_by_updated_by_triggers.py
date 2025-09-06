"""v3.6.0: 0008 -- add created_by, updated_by triggers

Revision ID: 20dbc0432ab9
Revises: 426a0ec94034
Create Date: 2025-09-06 10:12:37.495927

"""
from typing import Sequence, Union
from pathlib import Path

from alembic import op

# revision identifiers, used by Alembic.
revision: str = '20dbc0432ab9'
down_revision: Union[str, None] = '426a0ec94034'
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
    trigger_function_sql = get_sql_file_content('created_by_updated_by_triggers_up.sql')
    op.execute(trigger_function_sql)


def downgrade() -> None:
    trigger_function_sql = get_sql_file_content('created_by_updated_by_triggers_down.sql')
    op.execute(trigger_function_sql)
