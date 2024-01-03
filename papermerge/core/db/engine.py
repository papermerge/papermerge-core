import os

from sqlalchemy import Engine, create_engine

engine = create_engine(
    os.environ.get(
        'PAPERMERGE__DATABASE__URL',
        'sqlite:////db/db.sqlite3'
    ),
    connect_args={"check_same_thread": False}
)


def get_engine() -> Engine:
    return engine
