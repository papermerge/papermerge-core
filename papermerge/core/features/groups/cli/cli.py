import typer
from rich.console import Console
from sqlalchemy import select

from papermerge.core.db.engine import AsyncSessionLocal
from papermerge.core.features.groups.db import orm
from papermerge.core.features.groups.db import api as dbapi
from papermerge.core.features.groups import schema


app = typer.Typer(help="Groups basic management")


@app.command()
async def create_admin(exists_ok: bool = True):
    """Creates group named 'admin'"""
    with AsyncSessionLocal() as db_session:
        await dbapi.create_group(db_session, name="admin", exists_ok=exists_ok)


@app.command("ls")
async def list_groups():
    """List existing groups and their scopes"""
    with AsyncSessionLocal() as session:
        stmt = select(orm.Group)
        db_items = session.scalars(stmt).unique()
        result = []
        for item in db_items:
            group = dict(name=item.name, id=item.id)
            result.append(schema.GroupDetails.model_validate(group))

    console = Console()
    for g in result:
        console.print(f"Name={g.name}")
