import typer
from rich.console import Console
from sqlalchemy import select
from sqlalchemy.orm import joinedload

from papermerge.core import db, schemas
from papermerge.core.auth import scopes
from papermerge.core.db import models

app = typer.Typer(help="Groups basic management")


@app.command()
def create_admin(exists_ok: bool = True):
    """Creates group named 'admin' containing all permissions"""
    db_session = db.get_session()
    all_scopes = [name for name, _ in scopes.SCOPES.items()]
    db.create_group(
        db_session,
        name='admin',
        scopes=all_scopes,
        exists_ok=exists_ok
    )


@app.command("ls")
def list_groups():
    """List existing groups and their scopes"""
    db_session = db.get_session()
    with db_session as session:
        stmt = select(models.Group).options(
            joinedload(models.Group.permissions)
        )
        db_items = session.scalars(stmt).unique()
        result = []
        for item in db_items:
            group = dict(name=item.name, id=item.id)
            group['scopes'] = [p.codename for p in item.permissions]
            result.append(
                schemas.GroupDetails.model_validate(group)
            )

    console = Console()
    for g in result:
        console.print(f"Name={g.name}")
        console.print(f"Scopes={','.join(g.scopes)}")
