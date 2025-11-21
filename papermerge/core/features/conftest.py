import base64
import asyncio
import os
import io
import uuid
import json
import tempfile
from pathlib import Path
from uuid import UUID

import pytest
from httpx import AsyncClient
from httpx import ASGITransport
from fastapi import FastAPI
from sqlalchemy import select, text, and_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from papermerge.core.types import MimeType
from papermerge.core import schema
from papermerge.core.utils.tz import utc_now
from papermerge.core.tests.resource_file import ResourceFile
from papermerge.core.types import OCRStatusEnum
from papermerge.core.features.auth.scopes import SCOPES
from papermerge.core.db.base import Base
from papermerge.core.db.engine import engine, get_db
from papermerge.core.features.document.db import api as doc_dbapi
from papermerge.core.features.document import schema as doc_schema
from papermerge.core.features.special_folders.db import \
    api as special_folders_api
from papermerge.core.features.custom_fields.schema import CustomFieldType
from papermerge.core.router_loader import discover_routers
from papermerge.core import orm, dbapi
from papermerge.core import utils
from papermerge.core.tests.types import AuthTestClient
from papermerge.core import config
from papermerge.core.constants import ContentType
from papermerge.core.types import OwnerType, ResourceType
from papermerge.core.features.ownership.db import api as ownership_api
from papermerge.core.features.document_types.db import api as dt_dbapi

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
        # Determine owner
        if user:
            owner_type = OwnerType.USER
            owner_id = user.id
        elif group:
            owner_type = OwnerType.GROUP
            owner_id = group.id
        else:
            raise ValueError("Either user or group argument must be provided")

        # Create folder WITHOUT user/group
        folder = orm.Folder(
            id=uuid.uuid4(),
            title=title,
            lang="de",
            parent_id=parent.id,
            ctype="folder",  # Make sure ctype is set
        )

        db_session.add(folder)
        await db_session.flush()

        # Set ownership
        await ownership_api.set_owner(
            session=db_session,
            resource_type=ResourceType.NODE,
            resource_id=folder.id,
            owner_type=owner_type,
            owner_id=owner_id
        )

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
        doc, _ = await doc_dbapi.create_document(db_session, attrs, mime_type=MimeType.application_pdf)

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
            parent_id=user.home_folder_id,
            lang=lang,
        )
        db_session.add(db_doc)
        await db_session.flush()

        # Set ownership
        await ownership_api.set_owner(
            session=db_session,
            resource_type=ResourceType.NODE,
            resource_id=db_doc.id,
            owner_type=OwnerType.USER,
            owner_id=user.id
        )

        db_doc_ver = orm.DocumentVersion(pages=db_pages, document=db_doc, lang=lang)
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


def get_app_with_routes():
    app = FastAPI()

    features_path = Path(__file__).parent.parent
    routers = discover_routers(features_path)

    for router, feature_name in routers:
        app.include_router(router, prefix="")

    return app


@pytest.fixture(scope="session", autouse=True)
async def setup_database():
    async with engine.begin() as conn:
        # Drop tables in reverse dependency order
        tables_to_drop = ["nodes", "users", "users_roles", "roles"]  # Add other tables as needed
        for table in tables_to_drop:
            try:
                await conn.execute(text(f"DROP TABLE IF EXISTS {table} CASCADE"))
            except Exception:
                pass

        await conn.run_sync(Base.metadata.create_all)

    yield

    async with engine.begin() as conn:
        await conn.execute(text("DELETE FROM nodes WHERE deleted_at IS NOT NULL"))
        await conn.execute(text("DELETE FROM users WHERE deleted_at IS NOT NULL"))
        await conn.execute(text("DELETE FROM users_roles WHERE deleted_at IS NOT NULL"))
        await conn.execute(text("DELETE FROM roles WHERE deleted_at IS NOT NULL"))

        # Drop tables with CASCADE
        for table in tables_to_drop:
            try:
                await conn.execute(text(f"DROP TABLE IF EXISTS {table} CASCADE"))
            except Exception:
                pass


@pytest.fixture(scope="function")
async def db_session():
    connection = await engine.connect()
    transaction = await connection.begin()
    session = AsyncSession(bind=connection, expire_on_commit=False)

    try:
        yield session
    finally:
        await session.close()

        # Handle case where transaction was already rolled back
        try:
            if transaction.is_active:  # ← Check if transaction is still active
                await transaction.rollback()
        except Exception:
            # Transaction already rolled back or in invalid state - ignore
            pass

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
    """
    Create test user with special folders.

    CHANGED: No longer needs SET CONSTRAINTS ALL DEFERRED
    """
    async def _maker(username: str, is_superuser: bool = True):
        user_id = uuid.uuid4()

        # Step 1: Create user
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
        db_session.add(db_user)
        await db_session.flush()

        # Step 2: Create special folders
        await special_folders_api.create_special_folders_for_user(
            db_session,
            user_id
        )

        await db_session.commit()
        await db_session.refresh(db_user)

        # Eagerly load the user with special_folders relationship
        stmt = (
            select(orm.User)
            .options(selectinload(orm.User.special_folders))
            .where(orm.User.id == user_id)
        )
        result = await db_session.execute(stmt)
        user = result.scalar_one()

        return user

    return _maker


@pytest.fixture
async def document_type_groceries(db_session: AsyncSession, user, make_custom_field_v2):
    cf1 = await make_custom_field_v2(name="Shop", type_handler="text")
    cf2 = await make_custom_field_v2(name="Total", type_handler="monetary")
    cf3 = await make_custom_field_v2(name="EffectiveDate", type_handler="date")

    # Create document type WITHOUT user parameter
    dt = orm.DocumentType(
        id=uuid.uuid4(),
        name="groceries"
    )
    db_session.add(dt)
    await db_session.flush()

    # Set ownership
    await ownership_api.set_owner(
        session=db_session,
        resource_type=ResourceType.DOCUMENT_TYPE,
        resource_id=dt.id,
        owner_type=OwnerType.USER,
        owner_id=user.id
    )

    # Associate custom fields
    for cf in [cf1, cf2, cf3]:
        dt_cf = orm.DocumentTypeCustomField(
            document_type_id=dt.id,
            custom_field_id=cf.id
        )
        db_session.add(dt_cf)

    await db_session.commit()
    await db_session.refresh(dt)

    return dt

@pytest.fixture
def make_document_type_without_cf(db_session: AsyncSession, user):
    async def _make_document_type(name: str):
        create_data = schema.CreateDocumentType(
            name=name,
            custom_field_ids=[],
            owner_type=OwnerType.USER,
            owner_id=user.id
        )
        return await dbapi.create_document_type(
            db_session,
            data=create_data
        )

    return _make_document_type


@pytest.fixture
async def document_type_zdf(db_session: AsyncSession, user, make_custom_field_v2):
    cf1 = await make_custom_field_v2(name="Start Date", type_handler=CustomFieldType.date)
    cf2 = await make_custom_field_v2(name="End Date", type_handler=CustomFieldType.date)
    cf3 = await make_custom_field_v2(name="Total Due", type_handler=CustomFieldType.monetary)

    create_data = schema.CreateDocumentType(
        name="ZDF",
        custom_field_ids=[cf1.id, cf2.id, cf3.id],
        owner_type=OwnerType.USER,
        owner_id=user.id
    )

    return await dbapi.create_document_type(
        db_session,
        data=create_data
    )


@pytest.fixture
def make_document_zdf(db_session: AsyncSession, document_type_zdf):
    async def _make_receipt(title: str, user: orm.User):
        doc = orm.Document(
            id=uuid.uuid4(),
            ctype="document",
            title=title,
            document_type_id=document_type_zdf.id,
            parent_id=user.home_folder_id,
        )
        db_session.add(doc)
        await db_session.flush()

        await ownership_api.set_owner(
            session=db_session,
            resource_type=ResourceType.NODE,
            resource_id=doc.id,
            owner_type=OwnerType.USER,
            owner_id=user.id
        )

        await db_session.commit()
        return doc

    return _make_receipt


@pytest.fixture
def make_document_salary(db_session: AsyncSession, document_type_salary):
    """
    UPDATED: Create document and set ownership
    """
    async def _make_salary(title: str, user: orm.User, parent=None):
        if parent is None:
            parent_id = user.home_folder_id
        else:
            parent_id = parent.id

        # Create document WITHOUT user parameter
        doc = orm.Document(
            id=uuid.uuid4(),
            ctype="document",
            title=title,
            document_type_id=document_type_salary.id,
            parent_id=parent_id,
            lang="deu",
        )
        db_session.add(doc)
        await db_session.flush()

        # Set ownership
        await ownership_api.set_owner(
            session=db_session,
            resource_type=ResourceType.NODE,
            resource_id=doc.id,
            owner_type=OwnerType.USER,
            owner_id=user.id
        )

        await db_session.commit()
        return doc

    return _make_salary


@pytest.fixture
async def document_type_tax(db_session: AsyncSession, user, make_custom_field_v2):
    cf = await make_custom_field_v2(name="Year", type_handler="integer")

    create_data = schema.CreateDocumentType(
        name="Tax",
        custom_field_ids=[cf.id],
        owner_type=OwnerType.USER,
        owner_id=user.id
    )

    return await dbapi.create_document_type(
        db_session,
        data=create_data
    )


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


@pytest.fixture()
def make_document_type(db_session, user):
    """
    UPDATED: Create document type with ownership
    """
    async def _maker(
        name: str,
        custom_fields: list = None,
        path_template: str | None = None,
        user: orm.User | None = None,
        group_id: UUID | None = None
    ):
        if custom_fields is None:
            custom_fields = []

        if group_id:
            owner_type = OwnerType.GROUP
            owner_id = group_id
        else:
            owner_type = OwnerType.USER
            owner_id = user.id if user else user.id

        dt = orm.DocumentType(
            id=uuid.uuid4(),
            path_template=path_template,
            name=name
        )
        db_session.add(dt)
        await db_session.flush()

        await ownership_api.set_owner(
            session=db_session,
            resource_type=ResourceType.DOCUMENT_TYPE,
            resource_id=dt.id,
            owner_type=owner_type,
            owner_id=owner_id
        )

        # Associate custom fields
        for cf in custom_fields:
            dt_cf = orm.DocumentTypeCustomField(
                document_type_id=dt.id,
                custom_field_id=cf.id
            )
            db_session.add(dt_cf)

        await db_session.commit()
        await db_session.refresh(dt)

        return dt

    return _maker


@pytest.fixture
def make_document_receipt(db_session: AsyncSession, document_type_groceries):
    async def _make_receipt(
        title: str,
        user: orm.User,
        parent=None,
        group_id: UUID | None = None
    ):
        if parent is None:
            parent_id = user.home_folder_id
        else:
            parent_id = parent.id

        # Determine owner
        if group_id:
            owner_type = OwnerType.GROUP
            owner_id = group_id
        else:
            owner_type = OwnerType.USER
            owner_id = user.id if user else user.id

        doc_id = uuid.uuid4()
        doc = orm.Document(
            id=doc_id,
            ctype="document",
            title=title,
            document_type_id=document_type_groceries.id,
            parent_id=parent_id,
            lang="deu",
        )

        db_session.add(doc)
        await db_session.flush()

        # Set ownership
        await ownership_api.set_owner(
            session=db_session,
            resource_type=ResourceType.NODE,
            resource_id=doc.id,
            owner_type=owner_type,
            owner_id=owner_id
        )

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
            document_type_id=document_type_tax.id,
            parent_id=parent_id,
            lang="deu",
        )

        db_session.add(doc)
        await db_session.flush()

        # Set ownership
        await ownership_api.set_owner(
            session=db_session,
            resource_type=ResourceType.NODE,
            resource_id=doc.id,
            owner_type=OwnerType.USER,
            owner_id=user.id
        )

        await db_session.commit()
        return doc

    return _make_tax

@pytest.fixture()
async def make_group(db_session: AsyncSession):
    """Create test group, optionally with special folders"""
    async def _maker(name: str, with_special_folders: bool = False):
        from papermerge.core.features.special_folders.db import api as special_folders_api

        group_id = uuid.uuid4()

        # Step 1: Create group
        group = orm.Group(
            id=group_id,
            name=name,
        )
        db_session.add(group)
        await db_session.flush()

        # Step 2: Create special folders if requested
        if with_special_folders:
            await special_folders_api.create_special_folders_for_group(
                db_session,
                group_id
            )

        await db_session.commit()
        await db_session.refresh(group)

        return group

    return _maker


@pytest.fixture()
def make_role(db_session, make_user, random_string):
    async def _maker(
        name: str,
        scopes: list[str] | None = None,
        user: orm.User | None = None
    ):
        if scopes is None:
            scopes = []

        if user is None:
            user = await make_user(username=random_string())

        stmt = select(orm.Permission).where(orm.Permission.codename.in_(scopes))
        perms = (await db_session.execute(stmt)).scalars().all()
        role = orm.Role(
            name=name,
            permissions=perms,
            created_by=user.id,
            created_at=utc_now(),
            updated_by=user.id,
            updated_at=utc_now()
        )
        db_session.add(role)
        await db_session.commit()

        return role

    return _maker


@pytest.fixture()
def random_string():
    """Generate a fresh random string each time it's called"""
    def _generator():
        return uuid.uuid4().hex[:12].upper()
    return _generator


@pytest.fixture
def make_custom_field_v2(db_session: AsyncSession, user):
    """
    UPDATED: Create custom field with ownership instead of user_id/group_id
    """
    async def _maker(
            name: str,
            type_handler: str = "text",
            config: dict | None = None,
            user_id: UUID | None = None,
            group_id: UUID | None = None
    ):
        if config is None:
            config = {}

        # Determine owner
        if user_id:
            owner_type = OwnerType.USER
            owner_id = user_id
        elif group_id:
            owner_type = OwnerType.GROUP
            owner_id = group_id
        else:
            # Default to the fixture user
            owner_type = OwnerType.USER
            owner_id = user.id

        # Create custom field WITHOUT user_id/group_id
        cf = orm.CustomField(
            id=uuid.uuid4(),
            name=name,
            type_handler=type_handler,
            config=config
        )
        db_session.add(cf)
        await db_session.flush()

        # Set ownership
        await ownership_api.set_owner(
            session=db_session,
            resource_type=ResourceType.CUSTOM_FIELD,
            resource_id=cf.id,
            owner_type=owner_type,
            owner_id=owner_id
        )

        await db_session.commit()
        await db_session.refresh(cf)

        return cf

    return _maker



@pytest.fixture
def make_custom_field_value(db_session: AsyncSession):
    """Create custom field value using new v2 architecture"""
    async def _maker(
            document_id: uuid.UUID,
            field_id: uuid.UUID,
            value: any
    ):
        from papermerge.core.features.custom_fields import schema as cf_schema
        from papermerge.core.features.custom_fields.db import api as cf_dbapi

        value_data = cf_schema.SetCustomFieldValue(
            field_id=field_id,
            value=value
        )

        cfv = await cf_dbapi.set_custom_field_value(
            db_session,
            document_id,
            value_data
        )

        return cfv

    return _maker


@pytest.fixture
async def make_tag_with_owner(db_session: AsyncSession):
    """
    NEW: Create tag with ownership
    """
    async def _maker(
            name: str,
            owner_type: OwnerType,
            owner_id: UUID,
            **kwargs
    ):
        tag = orm.Tag(
            id=uuid.uuid4(),
            name=name,
            **kwargs
        )
        db_session.add(tag)
        await db_session.flush()

        await ownership_api.set_owner(
            session=db_session,
            resource_type=ResourceType.TAG,
            resource_id=tag.id,
            owner_type=owner_type,
            owner_id=owner_id
        )

        await db_session.commit()
        await db_session.refresh(tag)
        return tag

    return _maker


@pytest.fixture
async def make_node_with_owner(db_session: AsyncSession):
    """
    NEW: Create node (folder/document) with ownership
    """
    async def _maker(
        title: str,
        ctype: str,
        owner_type: OwnerType,
        owner_id: UUID,
        parent_id: UUID | None = None,
        **kwargs
    ):
        if ctype == "folder":
            node = orm.Folder(
                id=uuid.uuid4(),
                title=title,
                ctype=ctype,
                parent_id=parent_id,
                **kwargs
            )
        else:
            node = orm.Document(
                id=uuid.uuid4(),
                title=title,
                ctype=ctype,
                parent_id=parent_id,
                **kwargs
            )

        db_session.add(node)
        await db_session.flush()

        await ownership_api.set_owner(
            session=db_session,
            resource_type=ResourceType.NODE,
            resource_id=node.id,
            owner_type=owner_type,
            owner_id=owner_id
        )

        await db_session.commit()
        await db_session.refresh(node)
        return node

    return _maker


@pytest.fixture
def make_document_with_numeric_cf(
    db_session: AsyncSession,
    make_custom_field_v2
):
    """
    Create a document of a specific type with one numeric custom field.

    This fixture creates:
    - A custom field of type "number" (decimal) - reuses if exists in DB
    - A document type with that custom field - reuses if exists in DB
    - A document of that type - ALWAYS NEW

    When called multiple times with the same doc_type_name and field_name,
    it will reuse the same document type and custom field from the database,
    creating only new documents. This allows testing multiple documents of the same type.

    Args:
        doc_type_name: Name of the document type (e.g., "Invoice")
        doc_title: Title of the document (e.g., "invoice-001.pdf")
        field_name: Name of the numeric custom field (e.g., "Amount")
        user: User who owns the document
        precision: Decimal precision for the numeric field (default: 2)
        parent: Parent folder (defaults to user's home folder)

    Returns:
        tuple: (document, custom_field)
    """

    async def _maker(
        doc_type_name: str,
        doc_title: str,
        field_name: str,
        user: orm.User,
        precision: int = 2,
        parent: orm.Folder = None
    ):
        # Step 1: Get or create numeric custom field (check DB first)
        stmt = select(orm.CustomField).where(
            and_(
                orm.CustomField.name == field_name,
                orm.CustomField.type_handler == "number"
            )
        ).join(
            orm.Ownership,
            and_(
                orm.Ownership.resource_type == ResourceType.CUSTOM_FIELD.value,
                orm.Ownership.resource_id == orm.CustomField.id,
                orm.Ownership.owner_type == OwnerType.USER.value,
                orm.Ownership.owner_id == user.id
            )
        )
        result = await db_session.execute(stmt)
        custom_field = result.scalar_one_or_none()

        if custom_field is None:
            # Create new custom field
            custom_field = await make_custom_field_v2(
                name=field_name,
                type_handler="number",  # "number" type stores as decimal
                config={
                    "precision": precision,
                    "use_thousand_separator": False,
                    "prefix": "",
                    "suffix": ""
                }
            )

        # Step 2: Get or create document type with the custom field (check DB first)
        stmt = select(orm.DocumentType).where(
            orm.DocumentType.name == doc_type_name
        ).join(
            orm.Ownership,
            and_(
                orm.Ownership.resource_type == ResourceType.DOCUMENT_TYPE.value,
                orm.Ownership.resource_id == orm.DocumentType.id,
                orm.Ownership.owner_type == OwnerType.USER.value,
                orm.Ownership.owner_id == user.id
            )
        )
        result = await db_session.execute(stmt)
        document_type = result.scalar_one_or_none()

        if document_type is None:
            # Create new document type
            create_dt_data = schema.CreateDocumentType(
                name=doc_type_name,
                custom_field_ids=[custom_field.id],
                owner_type=OwnerType.USER,
                owner_id=user.id
            )

            document_type = await dt_dbapi.create_document_type(
                db_session,
                data=create_dt_data
            )

        # Step 3: Create document of this type (always new)
        if parent is None:
            parent_id = user.home_folder_id
        else:
            parent_id = parent.id

        doc = orm.Document(
            id=uuid.uuid4(),
            ctype="document",
            title=doc_title,
            document_type_id=document_type.id,
            parent_id=parent_id,
            lang="deu",
        )
        db_session.add(doc)
        await db_session.flush()

        # Step 4: Set ownership on the document
        await ownership_api.set_owner(
            session=db_session,
            resource_type=ResourceType.NODE,
            resource_id=doc.id,
            owner_type=OwnerType.USER,
            owner_id=user.id
        )

        await db_session.commit()
        await db_session.refresh(doc)
        await db_session.refresh(custom_field)

        return doc, custom_field

    return _maker
