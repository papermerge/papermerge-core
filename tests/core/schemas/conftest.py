import pytest
from papermerge.core.models import User


@pytest.fixture
def user():
    return User.objects.create_user(username="user1")
