import pytest
from sqlalchemy import Engine
from sqlalchemy.orm import Session

from papermerge.core.db.base import Base
from papermerge.core.db.engine import engine
from papermerge.core.models import Document, User
from papermerge.test.baker_recipes import document_recipe, user_recipe


@pytest.fixture()
def user() -> User:
    return user_recipe.make()


@pytest.fixture()
def document() -> Document:
    u = user_recipe.make()
    doc = document_recipe.make(user=u, parent=u.home_folder)

    return doc


@pytest.fixture(autouse=True, scope="session")
def db_schema():
    Base.metadata.create_all(engine)
    yield
    Base.metadata.drop_all(engine)


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
