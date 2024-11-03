import typer
from rich.console import Console
from rich.table import Table

from papermerge.core.db.engine import Session
from papermerge.core.features.users.db import api as usr_dbapi
from papermerge.core.features.users import schema as usr_schema

app = typer.Typer(help="List various entities")


@app.command()
def users():
    """List existing users"""
    with Session() as db_session:
        users: list[usr_schema.User] = usr_dbapi.get_users(db_session)

    print_users(users)


def print_users(users: list[usr_schema.User]):
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
            str(user.inbox_folder_id),
        )

    console = Console()
    console.print(table)


if __name__ == "__main__":
    app()
