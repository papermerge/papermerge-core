import base64
import asyncio
import os
import io
import uuid
import json
import tempfile
from pathlib import Path

import pytest
from httpx import AsyncClient
from httpx import ASGITransport
from fastapi import FastAPI
from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from papermerge.core.tests.resource_file import ResourceFile
from papermerge.core.types import OCRStatusEnum
from papermerge.core import constants
from papermerge.core.features.auth.scopes import SCOPES
from papermerge.core.db.base import Base
from papermerge.core.db.engine import engine, get_db
from papermerge.core.features.custom_fields import router as cf_router
from papermerge.core.features.document.db import api as doc_dbapi
from papermerge.core.features.document import schema as doc_schema
from papermerge.core.features.custom_fields.db import api as cf_dbapi
from papermerge.core.features.nodes import router as nodes_router
from papermerge.core.features.nodes import router_folders as folders_router
from papermerge.core.features.document import router as docs_router
from papermerge.core.features.document import router_pages as pages_router
from papermerge.core.features.document import (
    router_document_version as document_versions_router,
)
from papermerge.core.features.nodes import \
    router_thumbnails as thumbnails_router
from papermerge.core.features.custom_fields.schema import CustomFieldType
from papermerge.core.features.document_types import \
    router as document_types_router
from papermerge.core.features.groups import router as groups_router
from papermerge.core.features.roles import router as roles_router
from papermerge.core.features.tags import router as tags_router
from papermerge.core.features.users import router as usr_router
from papermerge.core.features.liveness_probe import router as probe_router
from papermerge.core import orm, dbapi, schema
from papermerge.core import utils
from papermerge.core.tests.types import AuthTestClient
from papermerge.core import config
from papermerge.core.constants import ContentType
from papermerge.core.features.shared_nodes.router import \
    router as shared_nodes_router

DIR_ABS_PATH = os.path.abspath(os.path.dirname(__file__))
RESOURCES = Path(DIR_ABS_PATH) / "document" / "tests" / "resources"


@pytest.fixture(scope="session")
def event_loop():
    """Create an instance of the default event loop for the test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


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
def make_folder(db_session: AsyncSession):
    async def _maker(
        title: str,
        parent: orm.Folder,
        user: orm.User | None = None,
        group: orm.Group | None = None,
    ):
        kwargs = {
            "id": uuid.uuid4(),
            "title": title,
            "lang": "de",
            "parent_id": parent.id,
        }
        if user:
            kwargs["user"] = user
        elif group:
            kwargs["group"] = group
        else:
            raise ValueError("Either user or group argument must be provided")

        folder = orm.Folder(**kwargs)
        db_session.add(folder)
        await db_session.commit()
        await db_session.refresh(folder)

        return folder

    return _maker


@pytest.fixture
def make_document(db_session: AsyncSession):
    async def _maker(
        title: str,
        parent: orm.Folder,
        ocr_status: OCRStatusEnum = OCRStatusEnum.unknown,
        lang: str = "deu",
        user: orm.User | None = None,
    ) -> doc_schema.Document:
        attrs = doc_schema.NewDocument(
            title=title, parent_id=parent.id, ocr_status=ocr_status, lang=lang
        )
        doc, _ = await doc_dbapi.create_document(db_session, attrs)

        if doc is None:
            raise Exception("Document was not created")

        return doc

    return _maker


@pytest.fixture
async def three_pages_pdf(make_document, db_session: AsyncSession, user) -> doc_schema.Document:
    doc: doc_schema.Document = await make_document(
        title="thee-pages.pdf", user=user, parent=user.home_folder
    )
    PDF_PATH = RESOURCES / "three-pages.pdf"

    with open(PDF_PATH, "rb") as file:
        content = file.read()
        size = os.stat(PDF_PATH).st_size
        await doc_dbapi.upload(
            db_session,
            document_id=doc.id,
            content=io.BytesIO(content),
            file_name="three-pages.pdf",
            size=size,
            content_type=ContentType.APPLICATION_PDF,
        )

    return doc


@pytest.fixture
def make_document_from_resource(make_document, db_session: AsyncSession):
    async def _make(resource: ResourceFile, user, parent):
        doc: doc_schema.Document = await make_document(
            title=resource, user=user, parent=parent
        )
        PDF_PATH = RESOURCES / resource

        with open(PDF_PATH, "rb") as file:
            content = file.read()
            size = os.stat(PDF_PATH).st_size
            await doc_dbapi.upload(
                db_session,
                document_id=doc.id,
                content=io.BytesIO(content),
                file_name=resource,
                size=size,
                content_type=ContentType.APPLICATION_PDF,
            )

        return doc

    return _make


@pytest.fixture
def make_document_with_pages(db_session: AsyncSession):
    """Creates a document with one version

    Document Version has 3 pages and one associated PDF file (also with 3 pages)
    """

    async def _maker(title: str, user: orm.User, parent: orm.Folder):
        attrs = doc_schema.NewDocument(
            title=title,
            parent_id=parent.id,
        )
        doc, _ = await doc_dbapi.create_document(db_session, attrs)
        PDF_PATH = RESOURCES / "three-pages.pdf"

        with open(PDF_PATH, "rb") as file:
            content = file.read()
            size = os.stat(PDF_PATH).st_size
            await doc_dbapi.upload(
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
def make_document_version(db_session: AsyncSession):
    async def _maker(
        page_count: int,
        user: orm.User,
        lang: str | None = None,
        pages_text: list[str] | None = None,
    ):
        db_pages = []
        if lang is None:
            lang = "deu"

        for number in range(1, page_count + 1):
            if pages_text and len(pages_text) >= number:
                text = pages_text[number - 1]
            else:
                text = None

            db_page = orm.Page(number=number, text=text, page_count=page_count)
            db_pages.append(db_page)

        doc_id = uuid.uuid4()
        db_doc = orm.Document(
            id=doc_id,
            ctype="document",
            title=f"Document {doc_id}",
            user_id=user.id,
            parent_id=user.home_folder_id,
            lang=lang,
        )
        db_doc_ver = orm.DocumentVersion(pages=db_pages, document=db_doc, lang=lang)
        db_session.add(db_doc)
        db_session.add(db_doc_ver)
        await db_session.commit()

        return db_doc_ver

    return _maker


@pytest.fixture()
def make_page(db_session: AsyncSession, user: orm.User):
    def _make():
        db_pages = []
        for number in range(1, 4):
            db_page = orm.Page(number=number, text="blah", page_count=3)
            db_pages.append(db_page)

        doc_id = uuid.uuid4()
        db_doc = orm.Document(
            id=doc_id,
            ctype="document",
            title=f"Document {doc_id}",
            user_id=user.id,
            parent_id=user.home_folder_id,
            lang="de",
        )
        db_doc_ver = orm.DocumentVersion(pages=db_pages, document=db_doc)
        db_session.add(db_doc)
        db_session.add(db_doc_ver)
        db_session.commit()

        return db_pages[0]

    return _make


@pytest.fixture()
async def my_documents_folder(db_session: AsyncSession, user, make_folder):
    my_docs = await make_folder(title="My Documents", user=user, parent=user.home_folder)
    return my_docs


def get_app_with_routes():
    app = FastAPI()

    app.include_router(document_types_router.router, prefix="")
    app.include_router(groups_router.router, prefix="")
    app.include_router(roles_router.router, prefix="")
    app.include_router(cf_router.router, prefix="")
    app.include_router(nodes_router.router, prefix="")
    app.include_router(shared_nodes_router, prefix="")
    app.include_router(folders_router.router, prefix="")
    app.include_router(docs_router.router, prefix="")
    app.include_router(pages_router.router, prefix="")
    app.include_router(document_versions_router.router, prefix="")
    app.include_router(thumbnails_router.router, prefix="")
    app.include_router(usr_router.router, prefix="")
    app.include_router(tags_router.router, prefix="")
    app.include_router(probe_router.router, prefix="")

    return app


@pytest.fixture(scope="session", autouse=True)
async def setup_database():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    yield

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest.fixture(scope="function")
async def db_session():
    connection = await engine.connect()
    transaction = await connection.begin()
    session = AsyncSession(bind=connection, expire_on_commit=False)

    try:
        yield session
    finally:
        await session.close()
        await transaction.rollback()
        await connection.close()


@pytest.fixture()
async def api_client(db_session):
    """Unauthenticated REST API client"""
    app = get_app_with_routes()

    def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as c:
        yield c

    app.dependency_overrides.clear()


@pytest.fixture()
async def auth_api_client(db_session, user: orm.User):
    """Authenticated REST API client"""
    app = get_app_with_routes()

    def override_get_db():
        yield db_session

    middle_part = utils.base64.encode(
        {
            "sub": str(user.id),
            "preferred_username": user.username,
            "email": user.email,
            "scopes": list(SCOPES.keys()),
        }
    )
    token = f"abc.{middle_part}.xyz"

    app.dependency_overrides[get_db] = override_get_db
    transport = ASGITransport(app=app)

    async with AsyncClient(
            transport=transport,
            base_url="http://test",
            headers={"Authorization": f"Bearer {token}"}
    ) as async_client:
        yield AuthTestClient(test_client=async_client, user=user)

    app.dependency_overrides.clear()

@pytest.fixture()
async def make_api_client(make_user, db_session):
    """Builds an authenticated client
    i.e. an instance of AuthTestClient with associated (and authenticated) user
    """

    def override_get_db():
        yield db_session

    async def _make(username: str):
        user = await make_user(username=username)  # Await the make_user call
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
        app.dependency_overrides[get_db] = override_get_db
        transport = ASGITransport(app=app)
        async_client = AsyncClient(
            transport=transport,
            base_url="http://test",
            headers={"Authorization": f"Bearer {token}"}
        )

        return AuthTestClient(test_client=async_client, user=user)

    return _make

@pytest.fixture()
async def login_as(db_session):
    def override_get_db():
        yield db_session

    async def _make(user):
        app = get_app_with_routes()
        app.dependency_overrides[get_db] = override_get_db

        middle_part = utils.base64.encode(
            {
                "sub": str(user.id),
                "preferred_username": user.username,
                "email": user.email,
                "scopes": list(SCOPES.keys()),
            }
        )
        token = f"abc.{middle_part}.xyz"
        transport = ASGITransport(app=app)

        async_client = AsyncClient(
            transport=transport,
            base_url="http://test",
            headers={"Authorization": f"Bearer {token}"}
        )

        return AuthTestClient(test_client=async_client, user=user)

    return _make


@pytest.fixture()
async def user(make_user) -> orm.User:
    return await make_user(username="random")


@pytest.fixture()
async def make_user(db_session: AsyncSession):
    async def _maker(username: str, is_superuser: bool = True):
        await db_session.execute(text("SET CONSTRAINTS ALL DEFERRED"))

        user_id = uuid.uuid4()
        home_id = uuid.uuid4()
        inbox_id = uuid.uuid4()

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

        db_session.add_all([db_home, db_inbox])
        await db_session.flush()  # This ensures folders are inserted first

        db_user = orm.User(
            id=user_id,
            username=username,
            email=f"{username}@mail.com",
            first_name=f"{username}_first",
            last_name=f"{username}_last",
            is_superuser=is_superuser,
            is_active=True,
            password="pwd",
            home_folder_id=home_id,
            inbox_folder_id=inbox_id
        )

        db_session.add(db_user)
        await db_session.flush()
        await db_session.refresh(db_user)

        # Eagerly load the user with home_folder and inbox_folder relationships
        from sqlalchemy.orm import selectinload
        from sqlalchemy import select

        stmt = select(orm.User).options(
            selectinload(orm.User.home_folder),
            selectinload(orm.User.inbox_folder),
            selectinload(orm.User.groups),
            selectinload(orm.User.roles)
        ).where(orm.User.id == user_id)

        result = await db_session.execute(stmt)
        return result.scalar_one()

    return _maker


@pytest.fixture
async def document_type_groceries(db_session: AsyncSession, user, make_custom_field):
    cf1 = await make_custom_field(name="Shop", type=CustomFieldType.text)
    cf2 = await make_custom_field(name="Total", type=CustomFieldType.monetary)
    cf3 = await make_custom_field(name="EffectiveDate", type=CustomFieldType.date)

    return await dbapi.create_document_type(
        db_session,
        name="Groceries",
        custom_field_ids=[cf1.id, cf2.id, cf3.id],
        user_id=user.id,
    )


@pytest.fixture
def make_document_type_without_cf(db_session: AsyncSession, user, make_custom_field):
    async def _make_document_type(name: str):
        return await dbapi.create_document_type(
            db_session,
            name=name,
            custom_field_ids=[],  # no custom fields
            user_id=user.id,
        )

    return _make_document_type


@pytest.fixture
async def document_type_zdf(db_session: AsyncSession, user, make_custom_field):
    cf1 = await make_custom_field(name="Start Date", type=CustomFieldType.date)
    cf2 = await make_custom_field(name="End Date", type=CustomFieldType.date)
    cf3 = await make_custom_field(name="Total Due", type=CustomFieldType.monetary)

    return await dbapi.create_document_type(
        db_session,
        name="ZDF",
        custom_field_ids=[cf1.id, cf2.id, cf3.id],
        user_id=user.id,
    )


@pytest.fixture
async def document_type_salary(db_session: AsyncSession, user, make_custom_field):
    cf1 = await make_custom_field(name="Month", type=CustomFieldType.yearmonth)
    cf2 = await make_custom_field(name="Total", type=CustomFieldType.monetary)
    cf3 = await make_custom_field(name="Company", type=CustomFieldType.date)

    return await dbapi.create_document_type(
        db_session,
        name="Salary",
        custom_field_ids=[cf1.id, cf2.id, cf3.id],
        user_id=user.id,
    )


@pytest.fixture
async def document_type_tax(db_session: AsyncSession, user, make_custom_field):
    cf = await make_custom_field(name="Year", type=CustomFieldType.int)

    return await dbapi.create_document_type(
        db_session,
        name="Tax",
        custom_field_ids=[cf.id],
        user_id=user.id,
    )


@pytest.fixture
def make_custom_field(db_session: AsyncSession, user):
    async def _make_custom_field(
        name: str, type: CustomFieldType, group_id: uuid.UUID | None = None
    ):
        if group_id:
            return await cf_dbapi.create_custom_field(
                db_session,
                name=name,
                type=type,
                group_id=group_id,
            )
        else:
            return await cf_dbapi.create_custom_field(
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


@pytest.fixture
async def make_document_type(db_session, make_user, make_custom_field):
    cf = await make_custom_field(name="some-random-cf", type=schema.CustomFieldType.boolean)

    async def _make_document_type(
        name: str,
        user: orm.User | None = None,
        path_template: str | None = None,
        group_id: uuid.UUID | None = None,
    ):
        if group_id is None:
            if user is None:
                user = await make_user("john")
            return await dbapi.create_document_type(
                db_session,
                name=name,
                custom_field_ids=[cf.id],
                path_template=path_template,
                user_id=user.id,
            )
        # document_type belongs to group_id
        return await dbapi.create_document_type(
            db_session,
            name=name,
            custom_field_ids=[cf.id],
            path_template=path_template,
            group_id=group_id,
        )

    return _make_document_type


@pytest.fixture
def make_document_receipt(db_session: AsyncSession, document_type_groceries):
    async def _make_receipt(title: str, user: orm.User, parent=None):
        if parent is None:
            parent_id = user.home_folder_id
        else:
            parent_id = parent.id

        doc_id = uuid.uuid4()
        doc = orm.Document(
            id=doc_id,
            ctype="document",
            title=title,
            user=user,
            document_type_id=document_type_groceries.id,
            parent_id=parent_id,
            lang="deu",
        )

        db_session.add(doc)

        await db_session.commit()

        return doc

    return _make_receipt


@pytest.fixture
def make_document_salary(db_session: AsyncSession, document_type_salary):
    async def _make_salary(title: str, user: orm.User, parent=None):
        if parent is None:
            parent_id = user.home_folder_id
        else:
            parent_id = parent.id

        doc_id = uuid.uuid4()
        doc = orm.Document(
            id=doc_id,
            ctype="document",
            title=title,
            user=user,
            document_type_id=document_type_salary.id,
            parent_id=parent_id,
            lang="deu",
        )

        db_session.add(doc)

        await db_session.commit()

        return doc

    return _make_salary


@pytest.fixture
def make_document_tax(db_session: AsyncSession, document_type_tax):
    async def _make_tax(title: str, user: orm.User, parent=None):
        if parent is None:
            parent_id = user.home_folder_id
        else:
            parent_id = parent.id

        doc_id = uuid.uuid4()
        doc = orm.Document(
            id=doc_id,
            ctype="document",
            title=title,
            user=user,
            document_type_id=document_type_tax.id,
            parent_id=parent_id,
            lang="deu",
        )

        db_session.add(doc)

        await db_session.commit()

        return doc

    return _make_tax


@pytest.fixture()
def make_group(db_session: AsyncSession):
    async def _maker(name: str, with_special_folders=False):
        if with_special_folders:
            group = orm.Group(name=name)
            uid = uuid.uuid4()
            db_session.add(group)
            folder = orm.Folder(id=uid, title="home", group=group, lang="de")
            db_session.add(folder)
            await db_session.commit()
            group.home_folder_id = uid
            await db_session.commit()
        else:
            group = orm.Group(name=name)
            db_session.add(group)
            await db_session.commit()

        stmt = select(orm.Group).options(
            selectinload(orm.Group.home_folder),
            selectinload(orm.Group.inbox_folder)
        ).where(orm.Group.id == group.id)
        result = await db_session.execute(stmt)
        group = result.scalar_one()

        return group

    return _maker


@pytest.fixture()
def make_role(db_session):
    async def _maker(name: str, scopes: list[str] | None = None):
        if scopes is None:
            scopes = []

        stmt = select(orm.Permission).where(orm.Permission.codename.in_(scopes))
        perms = (await db_session.execute(stmt)).scalars().all()
        role = orm.Role(name=name, permissions=perms)
        db_session.add(role)
        await db_session.commit()

        return role

    return _maker


@pytest.fixture()
def random_string():
    from random import choice
    from string import ascii_uppercase

    ret = "".join(choice(ascii_uppercase) for i in range(12))
    return ret


@pytest.fixture
def make_document_zdf(db_session: AsyncSession, document_type_zdf):
    async def _make_receipt(title: str, user: orm.User):
        doc = orm.Document(
            id=uuid.uuid4(),
            ctype="document",
            title=title,
            user=user,
            document_type_id=document_type_zdf.id,
            parent_id=user.home_folder_id,
        )

        db_session.add(doc)

        await db_session.commit()

        return doc

    return _make_receipt
