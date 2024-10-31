import logging
import os

from sqlalchemy import Engine, create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import NullPool

SQLALCHEMY_DATABASE_URL = os.environ.get(
    "PAPERMERGE__DATABASE__URL", "sqlite:////db/db.sqlite3"
)
connect_args = {}
logger = logging.getLogger(__name__)

if SQLALCHEMY_DATABASE_URL.startswith("sqlite"):
    # sqlite specific connection args
    connect_args = {"check_same_thread": False}

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args=connect_args, poolclass=NullPool
)

Session = sessionmaker(engine, expire_on_commit=False)


def get_engine() -> Engine:
    return engine
