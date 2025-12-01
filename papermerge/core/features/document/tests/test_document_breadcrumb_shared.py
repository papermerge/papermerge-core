from sqlalchemy.ext.asyncio import AsyncSession

from papermerge.core import dbapi
from papermerge.core.features.auth import scopes
from papermerge.core.features.document.db import api as doc_dbapi
from papermerge.core.types import BreadcrumbRootType


async def test_document_breadcrumb_owner_sees_full_path(
    make_user, make_folder, make_document, db_session: AsyncSession
):
    """Owner sees full breadcrumb including home folder"""
    john = await make_user("john", is_superuser=False)
    projects = await make_folder("Projects", user=john, parent=john.home_folder)
    flights = await make_folder("Flights 001", user=john, parent=projects)
    doc = await make_document("doc1.pdf", user=john, parent=flights)

    result = await doc_dbapi.get_doc(db_session, id=doc.id, user_id=john.id)

    breadcrumb_titles = [item[1] for item in result.breadcrumb.path]

    assert "home" in breadcrumb_titles
    assert "Projects" in breadcrumb_titles
    assert "Flights 001" in breadcrumb_titles
    assert "doc1.pdf" in breadcrumb_titles
    assert result.breadcrumb.root == BreadcrumbRootType.HOME


async def test_document_breadcrumb_shared_user_sees_truncated_path(
    make_user, make_folder, make_document, db_session: AsyncSession
):
    """User with shared access sees breadcrumb starting from shared folder"""
    await dbapi.sync_perms(db_session)

    john = await make_user("john", is_superuser=False)
    dora = await make_user("dora", is_superuser=False)

    projects = await make_folder("Projects", user=john, parent=john.home_folder)
    flights = await make_folder("Flights 001", user=john, parent=projects)
    doc = await make_document("doc1.pdf", user=john, parent=flights)

    role, _ = await dbapi.create_role(
        db_session, "View Role", scopes=[scopes.NODE_VIEW]
    )
    await dbapi.create_shared_nodes(
        db_session,
        user_ids=[dora.id],
        node_ids=[flights.id],
        role_ids=[role.id],
        owner_id=john.id,
    )

    result = await doc_dbapi.get_doc(db_session, id=doc.id, user_id=dora.id)

    breadcrumb_titles = [item[1] for item in result.breadcrumb.path]

    assert "home" not in breadcrumb_titles
    assert "Projects" not in breadcrumb_titles
    assert breadcrumb_titles == ["Flights 001", "doc1.pdf"]
    assert result.breadcrumb.root == BreadcrumbRootType.SHARED


async def test_document_breadcrumb_nested_in_shared_folder(
    make_user, make_folder, make_document, db_session: AsyncSession
):
    """Nested document shows correct truncated breadcrumb"""
    await dbapi.sync_perms(db_session)

    john = await make_user("john", is_superuser=False)
    dora = await make_user("dora", is_superuser=False)

    projects = await make_folder("Projects", user=john, parent=john.home_folder)
    flights = await make_folder("Flights 001", user=john, parent=projects)
    year_folder = await make_folder("2024", user=john, parent=flights)
    doc = await make_document("doc1.pdf", user=john, parent=year_folder)

    role, _ = await dbapi.create_role(
        db_session, "View Role", scopes=[scopes.NODE_VIEW]
    )
    await dbapi.create_shared_nodes(
        db_session,
        user_ids=[dora.id],
        node_ids=[flights.id],
        role_ids=[role.id],
        owner_id=john.id,
    )

    result = await doc_dbapi.get_doc(db_session, id=doc.id, user_id=dora.id)

    breadcrumb_titles = [item[1] for item in result.breadcrumb.path]
    assert breadcrumb_titles == ["Flights 001", "2024", "doc1.pdf"]
    assert result.breadcrumb.root == BreadcrumbRootType.SHARED


async def test_document_breadcrumb_in_inbox(
    make_user, make_document, db_session: AsyncSession
):
    """Document in inbox shows INBOX as root type"""
    john = await make_user("john", is_superuser=False)
    doc = await make_document("doc1.pdf", user=john, parent=john.inbox_folder)

    result = await doc_dbapi.get_doc(db_session, id=doc.id, user_id=john.id)

    assert result.breadcrumb.root == BreadcrumbRootType.INBOX
