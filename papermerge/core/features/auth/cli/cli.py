import typer
from rich.console import Console
from rich.table import Table

from papermerge.core.features.auth.scopes import SCOPES

app = typer.Typer(help="Scopes management")


@app.command("ls")
def scopes_list():
    """List current scopes (as defined in application code)"""
    table = Table(title="Scopes")

    table.add_column("codename")
    table.add_column("description")

    for codename, descr in SCOPES.items():
        table.add_row(codename, descr)

    console = Console()
    console.print(table)
