import logging
import os

from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from sqlalchemy import create_engine
from sqlalchemy.pool import NullPool

SQLALCHEMY_DATABASE_URL = os.environ.get(
    "PAPERMERGE__DATABASE__URL", "sqlite:////db/db.sqlite3"
)
connect_args = {}
logger = logging.getLogger(__name__)

async_engine = create_async_engine(
    SQLALCHEMY_DATABASE_URL.replace(
        "postgresql://", "postgresql+asyncpg://", 1
    ), connect_args=connect_args, poolclass=NullPool
)

engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args=connect_args, poolclass=NullPool)

AsyncSessionLocal = async_sessionmaker(async_engine, expire_on_commit=False)

async def get_db():
    async with AsyncSessionLocal() as session:
        yield session


def get_engine():
    return async_engine
