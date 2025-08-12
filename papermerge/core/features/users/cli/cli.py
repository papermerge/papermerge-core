import asyncio
from typing import Sequence

from prompt_toolkit import prompt
from typing_extensions import Annotated
import typer
from rich.console import Console
from rich.table import Table
from sqlalchemy import select
from sqlalchemy.exc import NoResultFound

from papermerge.core import orm, schema
from papermerge.core.db.engine import AsyncSessionLocal
from papermerge.core.features.users.db import api as usr_dbapi
from papermerge.core.utils.cli import async_command

app = typer.Typer(help="Users management")
console = Console()



@app.command(name="ls")
@async_command
async def list_users(page_size: int = 10, page_number: int = 1):
    """List users"""
    async with AsyncSessionLocal() as db_session:
        users: schema.PaginatedResponse[schema.User] = await usr_dbapi.get_users(
            db_session, page_size=page_size, page_number=page_number
        )

    if len(users.items) == 0:
        console.print("No users found")
    else:
        print_users(users.items)


Username = Annotated[
    str, typer.Option(prompt=True, envvar="PAPERMERGE__AUTH__USERNAME")
]
Email = Annotated[str, typer.Option(envvar="PAPERMERGE__AUTH__EMAIL")]
Password = Annotated[
    str, typer.Option(prompt=True, envvar="PAPERMERGE__AUTH__PASSWORD")
]


@app.command(name="create")
@async_command
async def create_user_cmd(
    username: Username,
    password: Password,
    email: Email = None,
    superuser: bool = False,
):
    """Create user"""
    if email is None:
        email = f"{username}@example.com"

    async with AsyncSessionLocal() as db_session:
        user, error = await usr_dbapi.create_user(
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
@async_command
async def delete_user_cmd(username: str):
    """Deletes user"""

    try:
        async with AsyncSessionLocal() as db_session:
            await usr_dbapi.delete_user(
                db_session,
                username=username,
            )
    except NoResultFound:
        console.print(f"User [bold]{username}[/bold] not found", style="red")
        raise typer.Exit(1)

    console.print(f"User [bold]{username}[/bold] successfully deleted", style="green")


@app.command(name="update")
@async_command
async def update_user_cmd(username: str, superuser: bool = False):
    """Update user"""

    try:
        async with AsyncSessionLocal() as db_session:
            stmt = select(orm.User).where(orm.User.username == username)
            user = (await db_session.execute(stmt)).scalar()
            attrs = schema.UpdateUser(is_superuser=superuser)
            await usr_dbapi.update_user(db_session, user_id=user.id, attrs=attrs)
    except NoResultFound:
        console.print(f"User [bold]{username}[/bold] not found", style="red")
        raise typer.Exit(1)

    console.print(f"User [bold]{username}[/bold] successfully updated", style="green")


def print_users(users: Sequence[schema.User]):
    table = Table(title="Users")

    table.add_column("ID", no_wrap=True)
    table.add_column("Username")
    table.add_column("Superuser?")
    table.add_column("Home ID")
    table.add_column("Inbox ID")

    for user in users:
        if user.is_superuser:
            is_superuser = "yes"
        else:
            is_superuser = "no"

        table.add_row(
            str(user.id),
            user.username,
            is_superuser,
            str(user.home_folder_id),
            str(user.inbox_folder_id),
        )

    console.print(table)
