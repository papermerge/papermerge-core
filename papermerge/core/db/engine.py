import logging

from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from sqlalchemy.pool import NullPool

from papermerge.core.config import settings

logger = logging.getLogger(__name__)

engine = create_async_engine(
    settings.async_db_url, poolclass=NullPool
)

AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False)

async def get_db():
    async with AsyncSessionLocal() as session:
        yield session


def get_engine():
    return engine
