import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from salinic import IndexRW, create_engine
from sqlalchemy.orm import Session

from papermerge.core import db, schemas
from papermerge.core.auth.scopes import SCOPES
from papermerge.core.models import User
from papermerge.core.routers import register_routers as reg_core_routers
from papermerge.core.schemas import CustomFieldType
from papermerge.core.utils import base64
from papermerge.search.routers import register_routers as reg_search_routers
from papermerge.test.baker_recipes import document_recipe
from papermerge.test.types import AuthTestClient


@pytest.fixture
def montaigne():
    return User.objects.create_user(
        username="montaigne", email="montaigne@mail.com", is_superuser=True
    )


@pytest.fixture
def user():
    return User.objects.create_user(
        username="user1", email="user1@mail.com", is_superuser=True
    )


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
def make_custom_field(db_session: Session, user: User):
    def _make_custom_field(name: str, type: schemas.CustomFieldType):
        return db.create_custom_field(
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


@pytest.fixture
def document_type_groceries(db_session: Session, user: User, make_custom_field):
    cf1 = make_custom_field(name="Shop", type=CustomFieldType.text)
    cf2 = make_custom_field(name="Total", type=CustomFieldType.monetary)
    cf3 = make_custom_field(name="EffectiveDate", type=CustomFieldType.date)

    return db.create_document_type(
        db_session,
        name="Groceries",
        custom_field_ids=[cf1.id, cf2.id, cf3.id],
        user_id=user.id,
    )


@pytest.fixture
def make_document_receipt(db_session: Session, user: User, document_type_groceries):
    def _make_receipt(title: str):
        return document_recipe.make(
            user=user,
            title=title,
            parent=user.home_folder,
            document_type_id=document_type_groceries.id,
        )

    return _make_receipt


@pytest.fixture
def document_type_with_two_integer_cf(
    db_session: Session, user: User, make_custom_field
):
    cf1 = make_custom_field(name="int-name1", type=CustomFieldType.int)
    cf2 = make_custom_field(name="int-name2", type=CustomFieldType.int)

    return db.create_document_type(
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

    return db.create_document_type(
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

    return db.create_document_type(
        db_session,
        name="document_type_with_one_string_cf",
        custom_field_ids=[cf1.id],
        user_id=user.id,
    )
