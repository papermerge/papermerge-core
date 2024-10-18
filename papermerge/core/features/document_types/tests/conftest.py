import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from papermerge.core import schemas
from papermerge.core.auth.scopes import SCOPES
from papermerge.core.db import create_custom_field
from papermerge.core.db.engine import engine
from papermerge.core.features.document_types import db
from papermerge.core.models import User
from papermerge.core.routers import register_routers as reg_core_routers
from papermerge.core.schemas import CustomFieldType
from papermerge.core.utils import base64
from papermerge.test.baker_recipes import user_recipe
from papermerge.test.types import AuthTestClient


@pytest.fixture()
def auth_api_client(user: User):
    app = FastAPI()
    reg_core_routers(app)

    middle_part = base64.encode(
        {
            "sub": str(user.id),
            "preferred_username": user.username,
            "email": user.email,
            "scopes": list(SCOPES.keys()),
        }
    )
    token = f"abc.{middle_part}.xyz"

    test_client = TestClient(app, headers={"Authorization": f"Bearer {token}"})

    return AuthTestClient(test_client=test_client, user=user)


@pytest.fixture
def make_custom_field(db_session: Session, user: User):
    def _make_custom_field(name: str, type: schemas.CustomFieldType):
        return create_custom_field(
            db_session,
            name=name,
            type=type,
            user_id=user.id,
        )

    return _make_custom_field


@pytest.fixture
def make_document_type(db_session: Session, user: User, make_custom_field):
    cf = make_custom_field(name="some-random-cf", type=CustomFieldType.boolean)

    def _make_document_type(name: str):
        return db.create_document_type(
            db_session,
            name=name,
            custom_field_ids=[cf.id],
            user_id=user.id,
        )

    return _make_document_type


@pytest.fixture()
def user() -> User:
    return user_recipe.make()


@pytest.fixture()
def db_session():
    with Session(engine) as session:
        yield session
