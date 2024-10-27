import logging
import os

import django
from sqlalchemy import Engine, create_engine
from sqlalchemy.pool import NullPool

SQLALCHEMY_DATABASE_URL = os.environ.get(
    "PAPERMERGE__DATABASE__URL", "sqlite:////db/db.sqlite3"
)
connect_args = {}
logger = logging.getLogger(__name__)

os.environ["DJANGO_SETTINGS_MODULE"] = "config.settings"
django.setup()

if SQLALCHEMY_DATABASE_URL.startswith("sqlite"):
    # sqlite specific connection args
    connect_args = {"check_same_thread": False}

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args=connect_args, poolclass=NullPool
)


def get_engine() -> Engine:
    return engine
