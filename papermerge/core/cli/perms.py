import typer
from rich.console import Console
from rich.table import Table

from papermerge.core import db, schemas
from papermerge.core.db.perms import get_perms

app = typer.Typer(help="List various entities")
engine = db.get_engine()


@app.command("ls")
def perms_list():
    """List database stored permissions"""
    perms: list[schemas.Permission] = get_perms(engine)
    print_perms(perms)


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
