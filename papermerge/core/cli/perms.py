import typer
from rich.console import Console
from rich.table import Table

from papermerge.core.db.engine import AsyncSessionLocal
from papermerge.core import dbapi
from papermerge.core import schema
from papermerge.core.utils.cli import async_command


app = typer.Typer(help="Permissions management")


@app.command("ls")
@async_command
async def perms_list():
    """List database stored permissions"""
    with AsyncSessionLocal() as db_session:
        perms: list[schema.Permission] = await dbapi.get_perms(db_session)
        print_perms(perms)


@app.command("sync")
@async_command
async def perms_sync():
    """Synchronizes permissions table with current scopes"""
    with AsyncSessionLocal() as db_session:
        await dbapi.sync_perms(db_session)


def print_perms(perms: list[schema.Permission]):
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
