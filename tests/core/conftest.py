import pytest

from papermerge.core.models import User
from papermerge.test.baker_recipes import user_recipe


@pytest.fixture()
def user() -> User:
    return user_recipe.make()
