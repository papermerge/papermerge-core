import uuid

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from papermerge.core import constants, schemas
from papermerge.core.auth.scopes import SCOPES
from papermerge.core.db import create_custom_field
from papermerge.core.db import models as orm
from papermerge.core.db.base import Base
from papermerge.core.db.engine import engine
from papermerge.core.features.document_types import db
from papermerge.core.routers import register_routers as reg_core_routers
from papermerge.core.schemas import CustomFieldType
from papermerge.core.utils import base64
from papermerge.test.types import AuthTestClient


@pytest.fixture(autouse=True, scope="function")
def db_schema():
    Base.metadata.create_all(engine)
    yield
    Base.metadata.drop_all(engine)


@pytest.fixture()
def auth_api_client(user: orm.User):
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
def make_custom_field(db_session: Session, user: orm.User):
    def _make_custom_field(name: str, type: schemas.CustomFieldType):
        return create_custom_field(
            db_session,
            name=name,
            type=type,
            user_id=user.id,
        )

    return _make_custom_field


@pytest.fixture
def make_document_type(db_session: Session, user: orm.User, make_custom_field):
    cf = make_custom_field(name="some-random-cf", type=CustomFieldType.boolean)

    def _make_document_type(name: str, path_template: str | None = None):
        return db.create_document_type(
            db_session,
            name=name,
            custom_field_ids=[cf.id],
            path_template=path_template,
            user_id=user.id,
        )

    return _make_document_type


@pytest.fixture()
def user(make_user) -> orm.User:
    return make_user(username="random")


@pytest.fixture()
def make_user(db_session: Session):
    def _maker(username: str, is_superuser: bool = True):
        user_id = uuid.uuid4()
        home_id = uuid.uuid4()
        inbox_id = uuid.uuid4()

        db_user = orm.User(
            id=user_id,
            username=username,
            email=f"{username}@mail.com",
            first_name=f"{username}_first",
            last_name=f"{username}_last",
            is_superuser=is_superuser,
            is_active=True,
            password="pwd",
        )
        db_inbox = orm.Folder(
            id=inbox_id,
            title=constants.INBOX_TITLE,
            ctype=constants.CTYPE_FOLDER,
            lang="de",
            user_id=user_id,
        )
        db_home = orm.Folder(
            id=home_id,
            title=constants.HOME_TITLE,
            ctype=constants.CTYPE_FOLDER,
            lang="de",
            user_id=user_id,
        )
        db_session.add_all([db_home, db_inbox, db_user])
        db_user.home_folder_id = db_home.id
        db_user.inbox_folder_id = db_inbox.id
        db_session.commit()

        return db_user

    return _maker


@pytest.fixture()
def db_session():
    with Session(engine) as session:
        yield session
