import typer
from rich import print
from rich.pretty import pprint

from papermerge.core.db.engine import Session
from papermerge.core.features.users import schema as usr_schema
from papermerge.core.features.users.db import api as usr_dbapi
from papermerge.core import utils

app = typer.Typer(help="JWT tokens management")


@app.command(name="encode")
def encode_cmd(username: str, scopes: str = None):
    """Encodes JWT token payload for given username"""
    try:
        with Session() as db_session:
            user: usr_schema.User = usr_dbapi.get_user(db_session, username)
    except Exception as e:
        print(f"[red]Error: {e}[/red]")
        raise typer.Exit(1)

    if scopes is None:
        scopes = []
    else:
        scopes = scopes.split(',')

    data64 = utils.base64.encode({
        "sub": str(user.id),
        "preferred_username": user.username,
        "email": user.email,
        "scopes": scopes,
    })
    print(f"Token payload=[green]{data64}[/green]")
    print(
        "Whole token will look something like "
        f"[red]blah.[/red][green]{data64}[/green][red].blah[/red]"
    )


@app.command(name="decode")
def decode_cmd(token_payload: str):
    """Decode JWT token payload

    Note that JWT token has three parts, delimited by dot character.
    For this command you need to provider only the middle part (i.e. payload).
    """
    if '.' in token_payload:
        print("[red]Doesn't look like JWT token payload because it contains dots[/red]")
        print(
            "JWT tokens have three parts delimited by dots. "
            "Payload is the middle part - [bold]without[/bold] dots"
        )
        raise typer.Exit(1)

    try:
        decoded_token_payload = utils.base64.decode(token_payload)
    except Exception as ex:
        print(f"[red]Decoding failed: {ex}[/red] ")
        print("Maybe input is not base64 string?")
        raise typer.Exit(1)

    pprint(decoded_token_payload, expand_all=True)
