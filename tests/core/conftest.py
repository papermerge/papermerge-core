import pytest
from sqlalchemy import Engine

from papermerge.core.db.base import Base
from papermerge.core.db.engine import Session, engine
from papermerge.core.models import Document
from papermerge.test.baker_recipes import document_recipe, user_recipe


@pytest.fixture()
def document() -> Document:
    u = user_recipe.make()
    doc = document_recipe.make(user=u, parent=u.home_folder)

    return doc


@pytest.fixture()
def db_connection():
    with engine.connect() as conn:
        yield conn


@pytest.fixture(scope="function")
def db_session():
    Base.metadata.create_all(engine)

    with Session() as session:
        yield session

    Base.metadata.drop_all(engine)


@pytest.fixture()
def db_engine() -> Engine:
    return engine
