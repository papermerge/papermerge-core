"""v3.6.0 - 0006: add association tables trigger

Revision ID: ed681f3a1768
Revises: 62bd9b006c5a
Create Date: 2025-08-21 07:28:17.501817

"""
from typing import Sequence, Union
from pathlib import Path

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = 'ed681f3a1768'
down_revision: Union[str, None] = '62bd9b006c5a'
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
    op.add_column('audit_log', sa.Column('audit_message', sa.Text(), nullable=True))
    trigger_function_sql = get_sql_file_content('audit_trigger_association_table_up.sql')
    op.execute(trigger_function_sql)


def downgrade() -> None:
    op.drop_column('audit_log', 'audit_message')
    trigger_function_sql = get_sql_file_content('audit_trigger_association_table_down.sql')
    op.execute(trigger_function_sql)
