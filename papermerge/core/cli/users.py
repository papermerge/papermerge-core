import typer
from rich.console import Console
from rich.table import Table

from papermerge.core import db, schemas
from papermerge.core.db.users import get_users

app = typer.Typer(help="List various entities")
engine = db.get_engine()


@app.command()
def users():
    """List existing users"""
    users: list[schemas.User] = get_users(engine)
    print_users(users)


def print_users(users: list[schemas.User]):
    table = Table(title="Users")

    table.add_column("UUID", style="cyan", no_wrap=True)
    table.add_column("Username", style="magenta")
    table.add_column("Home UUID", style="green")
    table.add_column("Inbox UUID", style="green")

    for user in users:
        table.add_row(
            str(user.id),
            user.username,
            str(user.home_folder_id),
            str(user.inbox_folder_id)
        )

    console = Console()
    console.print(table)
