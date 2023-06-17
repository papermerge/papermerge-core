import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from papermerge.core.models import User
from papermerge.core.routers import register_routers
from papermerge.core.utils import base64
from papermerge.test.types import AuthTestClient


@pytest.fixture
def user():
    return User.objects.create_user(username="user1")


@pytest.fixture()
def api_client():
    app = FastAPI()
    register_routers(app)
    return TestClient(app)


@pytest.fixture()
def auth_api_client(user: User):
    app = FastAPI()
    register_routers(app)

    middle_part = base64.encode({
        'user_id': str(user.id)
    })
    token = f"abc.{middle_part}.xyz"

    test_client = TestClient(
        app,
        headers={
            'Authorization': f'Bearer {token}'
        }
    )

    return AuthTestClient(
        test_client=test_client,
        user=user
    )
