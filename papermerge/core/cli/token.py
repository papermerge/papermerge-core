import typer
from rich import print
from rich.pretty import pprint

from papermerge.core import db, schemas, utils

app = typer.Typer(help="Basic JWT tokens management")
engine = db.get_engine()


@app.command()
def encode(username: str, scopes: str = None):
    """Encodes JWT token payload for given username"""
    try:
        user: schemas.User = db.get_user(engine, username)
    except db.UserNotFound:
        print("[red]User not found[/red]")
        return

    if scopes is None:
        scopes = []
    else:
        scopes = scopes.split(',')

    data64 = utils.base64.encode({
        "user_id": str(user.id),
        "scopes": scopes
    })
    print(f"Token payload=[green]{data64}[/green]")
    print(
        "Whole token will look something like "
        f"[red]blah.[/red][green]{data64}[/green][red].blah[/red]"
    )


@app.command()
def decode(token_payload: str):
    """Decode JWT token payload

    Note that JWT token has three parts, delimited by dot character.
    For this command you need to provider only the middle part (i.e. payload).
    """
    if '.' in token_payload:
        print("[red]Doesn't look like JWT token payload[/red]")
        print("JWT payload do not contain dots")
        return

    try:
        decoded_token_payload = utils.base64.decode(token_payload)
    except Exception as ex:
        print(f"[red]Decoding failed: {ex}[/red] ")
        print("Maybe input is not base64 string?")
        return

    pprint(decoded_token_payload, expand_all=True)
