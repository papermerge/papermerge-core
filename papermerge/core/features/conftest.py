import base64
import os
import io
import uuid
import json
import tempfile
from pathlib import Path

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from papermerge.core import constants
from papermerge.core.features.auth.scopes import SCOPES
from papermerge.core.db.base import Base
from papermerge.core.db.engine import Session, engine
from papermerge.core.features.custom_fields import router as cf_router

from papermerge.core.features.document.db import api as doc_dbapi
from papermerge.core.features.document.db import orm as doc_orm
from papermerge.core.features.document import schema as doc_schema

from papermerge.core.features.custom_fields.db import api as cf_dbapi
from papermerge.core.features.nodes import router as nodes_router
from papermerge.core.features.nodes import router_folders as folders_router
from papermerge.core.features.nodes import router_thumbnails as thumbnails_router
from papermerge.core.features.custom_fields.schema import CustomFieldType
from papermerge.core.features.document_types import router as document_types_router
from papermerge.core.features.document_types.db import api as dt_dbapi
from papermerge.core.features.groups import router as groups_router
from papermerge.core.features.tags import router as tags_router
from papermerge.core.features.users import router as usr_router
from papermerge.core import orm
from papermerge.core import utils
from papermerge.test.types import AuthTestClient
from papermerge.core import config
from papermerge.core.constants import ContentType


DIR_ABS_PATH = os.path.abspath(os.path.dirname(__file__))
RESOURCES = Path(DIR_ABS_PATH) / "document" / "tests" / "resources"


@pytest.fixture(autouse=True)
def mock_media_root_env(monkeypatch):
    """Create test's scoped media root folder

    During each test a temporary folder is created and
    media root configuration value is set to the temporary folder

    After test finishes all content of temporary folder is deleted
    """
    settings = config.get_settings()

    with tempfile.TemporaryDirectory() as tmpdirname:

        def new_get_settings():
            return settings

        settings.papermerge__main__media_root = tmpdirname
        monkeypatch.setattr(config, "get_settings", new_get_settings)
        yield


@pytest.fixture()
def make_folder(db_session: Session):
    def _maker(title: str, user: orm.User, parent: orm.Folder):
        folder = orm.Folder(
            id=uuid.uuid4(), title=title, user=user, parent_id=parent.id, lang="de"
        )
        db_session.add(folder)
        db_session.commit()
        return folder

    return _maker


@pytest.fixture
def make_document(db_session: Session):
    def _maker(title: str, user: orm.User, parent: orm.Folder):
        attrs = doc_schema.NewDocument(
            title=title,
            parent_id=parent.id,
        )
        doc, _ = doc_dbapi.create_document(db_session, attrs, user.id)
        return doc

    return _maker


@pytest.fixture
def make_document_with_pages(db_session: Session):
    """Creates a document with one version

    Document Version has 3 pages and one associated PDF file (also with 3 pages)
    """

    def _maker(title: str, user: orm.User, parent: orm.Folder):
        attrs = doc_schema.NewDocument(
            title=title,
            parent_id=parent.id,
        )
        doc, _ = doc_dbapi.create_document(db_session, attrs, user.id)
        PDF_PATH = RESOURCES / "three-pages.pdf"

        with open(PDF_PATH, "rb") as file:
            content = file.read()
            size = os.stat(PDF_PATH).st_size
            doc_dbapi.upload(
                db_session,
                document_id=doc.id,
                content=io.BytesIO(content),
                file_name="three-pages.pdf",
                size=size,
                content_type=ContentType.APPLICATION_PDF,
            )
        return doc

    return _maker


@pytest.fixture()
def make_document_version(db_session: Session):
    def _maker(page_count: int, user: orm.User, pages_text: list[str] | None = None):
        db_pages = []
        for number in range(1, page_count + 1):
            if pages_text and len(pages_text) >= number:
                text = pages_text[number - 1]
            else:
                text = None

            db_page = doc_orm.Page(number=number, text=text, page_count=page_count)
            db_pages.append(db_page)

        doc_id = uuid.uuid4()
        db_doc = doc_orm.Document(
            id=doc_id,
            ctype="document",
            title=f"Document {doc_id}",
            user_id=user.id,
            parent_id=user.home_folder_id,
            lang="de",
        )
        db_doc_ver = doc_orm.DocumentVersion(pages=db_pages, document=db_doc)
        db_session.add(db_doc)
        db_session.add(db_doc_ver)
        db_session.commit()

        return doc_schema.DocumentVersion.model_validate(db_doc_ver)

    return _maker


@pytest.fixture()
def make_page(db_session: Session, user: orm.User):
    def _make():
        db_pages = []
        for number in range(1, 4):
            db_page = doc_orm.Page(number=number, text="blah", page_count=3)
            db_pages.append(db_page)

        doc_id = uuid.uuid4()
        db_doc = doc_orm.Document(
            id=doc_id,
            ctype="document",
            title=f"Document {doc_id}",
            user_id=user.id,
            parent_id=user.home_folder_id,
            lang="de",
        )
        db_doc_ver = doc_orm.DocumentVersion(pages=db_pages, document=db_doc)
        db_session.add(db_doc)
        db_session.add(db_doc_ver)
        db_session.commit()

        return db_pages[0]

    return _make


@pytest.fixture()
def my_documents_folder(db_session: Session, user, make_folder):
    my_docs = make_folder(title="My Documents", user=user, parent=user.home_folder)
    return my_docs


@pytest.fixture(scope="function")
def db_session():
    Base.metadata.create_all(engine)
    with Session() as session:
        yield session

    Base.metadata.drop_all(engine)


def get_app_with_routes():
    app = FastAPI()

    app.include_router(document_types_router.router, prefix="")
    app.include_router(groups_router.router, prefix="")
    app.include_router(cf_router.router, prefix="")
    app.include_router(nodes_router.router, prefix="")
    app.include_router(folders_router.router, prefix="")
    app.include_router(thumbnails_router.router, prefix="")
    app.include_router(usr_router.router, prefix="")
    app.include_router(tags_router.router, prefix="")

    return app


@pytest.fixture()
def api_client():
    """Unauthenticated REST API client"""
    app = get_app_with_routes()

    return TestClient(app)


@pytest.fixture()
def auth_api_client(user: orm.User):
    """Authenticated REST API client"""
    app = get_app_with_routes()

    middle_part = utils.base64.encode(
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


@pytest.fixture
def document_type_groceries(db_session: Session, user, make_custom_field):
    cf1 = make_custom_field(name="Shop", type=CustomFieldType.text)
    cf2 = make_custom_field(name="Total", type=CustomFieldType.monetary)
    cf3 = make_custom_field(name="EffectiveDate", type=CustomFieldType.date)

    return dt_dbapi.create_document_type(
        db_session,
        name="Groceries",
        custom_field_ids=[cf1.id, cf2.id, cf3.id],
        user_id=user.id,
    )


@pytest.fixture
def make_custom_field(db_session: Session, user):
    def _make_custom_field(name: str, type: CustomFieldType):
        return cf_dbapi.create_custom_field(
            db_session,
            name=name,
            type=type,
            user_id=user.id,
        )

    return _make_custom_field


def b64e(s):
    return base64.b64encode(s.encode()).decode()


@pytest.fixture
def token():
    data = {
        "sub": "100",
        "preferred_username": "montaigne",
        "email": "montaingne@mail.com",
    }
    json_str = json.dumps(data)

    payload = b64e(json_str)

    return f"ignore_me.{payload}.ignore_me_too"
