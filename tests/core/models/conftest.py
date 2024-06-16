import pytest
from sqlalchemy import Engine
from sqlalchemy.orm import Session

from papermerge.core.db.engine import engine


@pytest.fixture()
def db_connection():
    with engine.connect() as conn:
        yield conn


@pytest.fixture()
def db_session():
    with Session(engine) as session:
        yield session


@pytest.fixture()
def db_engine() -> Engine:
    return engine
