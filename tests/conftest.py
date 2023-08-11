import pytest
from django.conf import settings
from fastapi import FastAPI
from fastapi.testclient import TestClient
from salinic import Session, create_engine
from salinic.engine import AccessMode

from papermerge.core.models import User
from papermerge.core.routers import register_routers as reg_core_routers
from papermerge.core.utils import base64
from papermerge.search.routers import register_routers as reg_search_routers
from papermerge.test.types import AuthTestClient


@pytest.fixture
def user():
    return User.objects.create_user(username="user1")


@pytest.fixture()
def api_client():
    app = FastAPI()

    reg_core_routers(app)
    reg_search_routers(app)

    return TestClient(app)


@pytest.fixture()
def auth_api_client(user: User):
    app = FastAPI()
    reg_core_routers(app)
    reg_search_routers(app)

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


@pytest.fixture()
def session(tmp_path) -> Session:
    engine = create_engine(settings.SEARCH_URL, mode=AccessMode.RW)

    return Session(engine)
