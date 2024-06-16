import typer
from rich.console import Console
from rich.table import Table

from papermerge.core import db, schemas

app = typer.Typer(help="List various entities")
db_session = db.get_session()


@app.command("ls")
def perms_list():
    """List database stored permissions"""
    perms: list[schemas.Permission] = db.get_perms(db_session)
    print_perms(perms)


@app.command("sync")
def perms_sync():
    """Synchronizes permissions table with current scopes"""
    db.sync_perms(db_session)


def print_perms(perms: list[schemas.Permission]):
    table = Table(title="Permissions")

    table.add_column("ID", style="cyan", no_wrap=True)
    table.add_column("codename", style="green")
    table.add_column("name", style="magenta")

    for perm in perms:
        table.add_row(
            str(perm.id),
            perm.codename,
            perm.name
        )

    console = Console()
    console.print(table)
