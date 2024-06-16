import typer
from rich.console import Console
from rich.table import Table

from papermerge.core.auth.scopes import SCOPES

app = typer.Typer(help="List scopes")


@app.command()
def scopes_list():
    """List current scopes (as defined in application code)"""
    table = Table(title="Scopes")

    table.add_column("codename", style="green")
    table.add_column("description", style="magenta")

    for codename, descr in SCOPES.items():
        table.add_row(codename, descr)

    console = Console()
    console.print(table)
