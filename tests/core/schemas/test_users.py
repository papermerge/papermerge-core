import pytest

from papermerge.core.models import User
from papermerge.core.schemas import User as PyUser


@pytest.mark.django_db
def test_model_validate_for_user(user: User):
    pyuser = PyUser.model_validate(user)

    assert pyuser.username == user.username
