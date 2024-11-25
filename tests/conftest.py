import uuid

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from salinic import IndexRW, create_engine
from sqlalchemy.orm import Session

from papermerge.core import constants
from core.auth import SCOPES
from papermerge.core.db import models as orm
from papermerge.core.features.custom_fields.db.api import create_custom_field
from papermerge.core.features.custom_fields.schema import CustomFieldType
from papermerge.core.features.document.db import orm as doc_orm
from papermerge.core.features.document_types.db import create_document_type
from papermerge.core.models import User
from papermerge.core.routers.router import register_routers as reg_core_routers
from papermerge.core.utils import base64
from papermerge.search.routers import register_routers as reg_search_routers
from papermerge.test.types import AuthTestClient


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
        db_session.add(db_inbox)
        db_session.add(db_home)
        db_session.add(db_user)
        db_session.commit()
        db_user.home_folder_id = db_home.id
        db_user.inbox_folder_id = db_inbox.id
        db_session.commit()

        return db_user

    return _maker


@pytest.fixture()
def auth_api_client(user: User):
    app = FastAPI()
    reg_core_routers(app)
    reg_search_routers(app)

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


@pytest.fixture()
def index(tmp_path, request) -> IndexRW:
    d = tmp_path / "index_db"
    d.mkdir()

    d = d / "test_db"
    d.mkdir()

    engine = create_engine(f"xapian://{d}")

    return IndexRW(engine, schema=request.param)


@pytest.fixture
def make_document_type(db_session: Session, make_user, make_custom_field):
    cf = make_custom_field(name="some-random-cf", type=CustomFieldType.boolean)

    def _make_document_type(name: str, user: orm.User | None = None):
        if user is None:
            user = make_user("john")

        return create_document_type(
            db_session,
            name=name,
            custom_field_ids=[cf.id],
            user_id=user.id,
        )

    return _make_document_type


@pytest.fixture
def document_type_with_two_integer_cf(
    db_session: Session, user: User, make_custom_field
):
    cf1 = make_custom_field(name="int-name1", type=CustomFieldType.int)
    cf2 = make_custom_field(name="int-name2", type=CustomFieldType.int)

    return create_document_type(
        db_session,
        name="document_type_with_two_integer_cf",
        custom_field_ids=[cf1.id, cf2.id],
        user_id=user.id,
    )


@pytest.fixture
def document_type_with_one_date_cf(  # cf = custom field
    db_session: Session, user: User, make_custom_field
):
    cf1 = make_custom_field(name="date-name1", type=CustomFieldType.date)

    return create_document_type(
        db_session,
        name="document_type_with_one_date_cf",
        custom_field_ids=[cf1.id],
        user_id=user.id,
    )


@pytest.fixture
def document_type_with_one_string_cf(  # cf = custom field
    db_session: Session, user: User, make_custom_field
):
    cf1 = make_custom_field(name="string-name1", type=CustomFieldType.text)

    return create_document_type(
        db_session,
        name="document_type_with_one_string_cf",
        custom_field_ids=[cf1.id],
        user_id=user.id,
    )


@pytest.fixture
def make_document_receipt(db_session: Session, user, document_type_groceries):
    def _make_receipt(title: str):
        doc_id = uuid.uuid4()
        doc = doc_orm.Document(
            id=doc_id,
            ctype="document",
            title=title,
            user_id=user.id,
            document_type_id=document_type_groceries.id,
            parent_id=user.home_folder_id,
            lang="de",
        )

        db_session.add(doc)

        db_session.commit()

        return doc

    return _make_receipt


@pytest.fixture
def document_type_groceries(db_session: Session, user, make_custom_field):
    cf1 = make_custom_field(name="Shop", type=CustomFieldType.text)
    cf2 = make_custom_field(name="Total", type=CustomFieldType.monetary)
    cf3 = make_custom_field(name="EffectiveDate", type=CustomFieldType.date)

    return create_document_type(
        db_session,
        name="Groceries",
        custom_field_ids=[cf1.id, cf2.id, cf3.id],
        user_id=user.id,
    )


@pytest.fixture
def make_custom_field(db_session: Session, user):
    def _make_custom_field(name: str, type: CustomFieldType):
        return create_custom_field(
            db_session,
            name=name,
            type=type,
            user_id=user.id,
        )

    return _make_custom_field
