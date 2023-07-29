

def get_db_path(dsn: str) -> str:
    return dsn.split('://')[1]
