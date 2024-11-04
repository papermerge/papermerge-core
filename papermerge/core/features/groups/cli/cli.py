import typer
from rich.console import Console
from sqlalchemy import select
from sqlalchemy.orm import joinedload

from papermerge.core.db.engine import Session
from papermerge.core.features.groups.db import orm
from papermerge.core.features.groups.db import api as dbapi
from papermerge.core.features.groups import schema
from papermerge.core.features.auth import scopes


app = typer.Typer(help="Groups basic management")


@app.command()
def create_admin(exists_ok: bool = True):
    """Creates group named 'admin' containing all permissions"""
    with Session() as db_session:
        all_scopes = [name for name, _ in scopes.SCOPES.items()]
        dbapi.create_group(
            db_session, name="admin", scopes=all_scopes, exists_ok=exists_ok
        )


@app.command("ls")
def list_groups():
    """List existing groups and their scopes"""
    with Session() as session:
        stmt = select(orm.Group).options(joinedload(orm.Group.permissions))
        db_items = session.scalars(stmt).unique()
        result = []
        for item in db_items:
            group = dict(name=item.name, id=item.id)
            group["scopes"] = [p.codename for p in item.permissions]
            result.append(schema.GroupDetails.model_validate(group))

    console = Console()
    for g in result:
        console.print(f"Name={g.name}")
        console.print(f"Scopes={','.join(g.scopes)}")
