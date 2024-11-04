import typer
from rich.console import Console
from rich.table import Table
from sqlalchemy.exc import NoResultFound

from papermerge.core.db.engine import Session
from papermerge.core.features.users.db import api as usr_dbapi
from papermerge.core.features.users import schema as usr_schema

app = typer.Typer(help="Users management")
console = Console()


@app.command(name="ls")
def list_users():
    """List users"""
    with Session() as db_session:
        users: list[usr_schema.User] = usr_dbapi.get_users(db_session)

    if len(users) == 0:
        console.print("No users found")
    else:
        print_users(users)


@app.command(name="create")
def create_user_cmd(
    username: str,
    superuser: bool = False,
    password: str | None = None,
    email: str | None = None,
):
    """Create user"""

    if password is None:
        password = username

    if email is None:
        email = f"{username}@papermerge.com"

    with Session() as db_session:
        user, error = usr_dbapi.create_user(
            db_session,
            username=username,
            password=password,
            is_superuser=superuser,
            email=email,
        )

    if error:
        console.print(error, style="red")
    else:
        console.print(
            f"User [bold]{username}[/bold] successfully created", style="green"
        )


@app.command(name="delete")
def delete_user_cmd(username: str):
    """Deletes user"""

    try:
        with Session() as db_session:
            usr_dbapi.delete_user(
                db_session,
                username=username,
            )
    except NoResultFound:
        console.print(f"User [bold]{username}[/bold] not found", style="red")
        raise typer.Exit(1)

    console.print(f"User [bold]{username}[/bold] successfully deleted", style="green")


def print_users(users: list[usr_schema.User]):
    table = Table(title="Users")

    table.add_column("ID", no_wrap=True)
    table.add_column("Username")
    table.add_column("Home ID")
    table.add_column("Inbox ID")

    for user in users:
        table.add_row(
            str(user.id),
            user.username,
            str(user.home_folder_id),
            str(user.inbox_folder_id),
        )

    console.print(table)


if __name__ == "__main__":
    app()
