import pytest

from papermerge.core.models import Document, User
from papermerge.test.baker_recipes import document_recipe, user_recipe
from papermerge.core.db.base import Base
from papermerge.core.db.engine import engine


@pytest.fixture()
def user() -> User:
    return user_recipe.make()


@pytest.fixture()
def document() -> Document:
    u = user_recipe.make()
    doc = document_recipe.make(user=u, parent=u.home_folder)

    return doc


@pytest.fixture(autouse=True)
def db_schema():
    Base.metadata.create_all(engine)
    yield
    Base.metadata.drop_all(engine)
