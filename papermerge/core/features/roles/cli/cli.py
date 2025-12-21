import asyncio

import typer
from rich.console import Console
from sqlalchemy import select
from sqlalchemy.orm import joinedload

from papermerge.core.db.engine import AsyncSessionLocal
from papermerge.core.features.roles.db import orm
from papermerge.core.features.roles.db import api as dbapi
from papermerge.core.features.roles import schema
from papermerge.core.features.auth import scopes

app = typer.Typer(help="Role management")


@app.command()
def create_standard_roles(exists_ok: bool = True):
    """Creates standard roles: admin, user, viewer with appropriate permissions"""
    asyncio.run(_create_standard_roles_async(exists_ok))

USER_SCOPES = [
    # Node operations
    scopes.NODE_CREATE,
    scopes.NODE_VIEW,
    scopes.NODE_UPDATE,
    scopes.NODE_DELETE,
    scopes.NODE_MOVE,
    # Document operations
    scopes.DOCUMENT_UPLOAD,
    scopes.DOCUMENT_DOWNLOAD,
    scopes.DOCUMENT_DOWNLOAD_ALL_VERSIONS,
    scopes.DOCUMENT_DOWNLOAD_LAST_VERSION_ONLY,
    scopes.DOCUMENT_UPDATE_TITLE,
    scopes.DOCUMENT_UPDATE_TAGS,
    scopes.DOCUMENT_UPDATE_CUSTOM_FIELDS,
    scopes.DOCUMENT_UPDATE_CATEGORY,
    # Tag operations
    scopes.TAG_SELECT,
    scopes.TAG_CREATE,
    scopes.TAG_VIEW,
    scopes.TAG_UPDATE,
    scopes.TAG_DELETE,
    # Custom field operations
    scopes.CUSTOM_FIELD_CREATE,
    scopes.CUSTOM_FIELD_VIEW,
    scopes.CUSTOM_FIELD_UPDATE,
    scopes.CUSTOM_FIELD_DELETE,
    # Document type operations
    scopes.DOCUMENT_TYPE_CREATE,
    scopes.DOCUMENT_TYPE_VIEW,
    scopes.DOCUMENT_TYPE_SELECT,
    scopes.DOCUMENT_TYPE_UPDATE,
    scopes.DOCUMENT_TYPE_DELETE,
    # Page operations
    scopes.PAGE_VIEW,
    scopes.PAGE_UPDATE,
    scopes.PAGE_REORDER,
    scopes.PAGE_ROTATE,
    scopes.PAGE_MOVE,
    scopes.PAGE_EXTRACT,
    scopes.PAGE_DELETE,
    # Shared node operations
    scopes.SHARED_NODE_CREATE,
    scopes.SHARED_NODE_VIEW,
    scopes.SHARED_NODE_UPDATE,
    scopes.SHARED_NODE_DELETE,
    # Task operations
    scopes.TASK_OCR,
    # OCR language
    scopes.OCRLANG_VIEW,
    # User (own profile only)
    scopes.USER_ME,
]

VIEWER_SCOPES = [
    # Node operations (view only)
    scopes.NODE_VIEW,
    # Document operations (download only)
    scopes.DOCUMENT_DOWNLOAD,
    scopes.DOCUMENT_DOWNLOAD_LAST_VERSION_ONLY,
    # Tag operations (select and view only)
    scopes.TAG_SELECT,
    scopes.TAG_VIEW,
    # Custom field operations (view only)
    scopes.CUSTOM_FIELD_VIEW,
    # Document type operations (select and view only)
    scopes.DOCUMENT_TYPE_VIEW,
    scopes.DOCUMENT_TYPE_SELECT,
    # Page operations (view only)
    scopes.PAGE_VIEW,
    # Shared node operations (view only)
    scopes.SHARED_NODE_VIEW,
    # OCR language
    scopes.OCRLANG_VIEW,
    # User (own profile only)
    scopes.USER_ME,
]

async def _create_standard_roles_async(exists_ok: bool = True):
    """Async implementation of create_standard_roles"""
    console = Console()

    async with AsyncSessionLocal() as db_session:
        # Admin role - all permissions
        all_scopes = [name for name, _ in scopes.SCOPES.items()]
        role, error = await dbapi.create_role(
            db_session, name="admin", scopes=all_scopes, exists_ok=exists_ok
        )
        if error:
            console.print(f"[red]✗[/red] Error creating 'admin' role: {error}")
        elif role:
            # Check if it was newly created or already existed
            # If exists_ok is True and role exists, it still returns the role
            console.print("[green]✓[/green] Role 'admin' ready with all permissions")
        await db_session.commit()

        # User role - standard document management permissions

        role, error = await dbapi.create_role(
            db_session, name="user", scopes=USER_SCOPES, exists_ok=exists_ok
        )
        if error:
            console.print(f"[red]✗[/red] Error creating 'user' role: {error}")
        elif role:
            console.print("[green]✓[/green] Role 'user' ready with document management permissions")
        await db_session.commit()

        # Viewer role - read-only permissions
        role, error = await dbapi.create_role(
            db_session, name="viewer", scopes=VIEWER_SCOPES, exists_ok=exists_ok
        )
        if error:
            console.print(f"[red]✗[/red] Error creating 'viewer' role: {error}")
        elif role:
            console.print("[green]✓[/green] Role 'viewer' ready with read-only permissions")
        await db_session.commit()


@app.command("ls")
def list_roles():
    """List existing roles and their scopes"""
    asyncio.run(_list_roles_async())


async def _list_roles_async():
    """Async implementation of list_roles"""
    async with AsyncSessionLocal() as session:
        stmt = select(orm.Role).options(joinedload(orm.Role.permissions))
        result_set = await session.execute(stmt)
        db_items = result_set.scalars().unique()
        result = []
        for item in db_items:
            role = dict(name=item.name, id=item.id)
            role["scopes"] = [p.codename for p in item.permissions]
            result.append(schema.RoleDetails.model_validate(role))

    console = Console()
    for g in result:
        console.print(f"Name={g.name}")
        console.print(f"Scopes={','.join(g.scopes)}")
