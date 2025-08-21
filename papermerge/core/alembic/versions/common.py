from pathlib import Path


def get_sql_file_content(filename: str) -> str:
    """Load SQL file from the sql directory"""
    sql_dir = Path(__file__).parent.parent / 'sql'
    sql_file = sql_dir / filename

    if not sql_file.exists():
        raise FileNotFoundError(f"SQL file not found: {sql_file}")

    return sql_file.read_text(encoding='utf-8')
