import typer
from rich import print
from rich.pretty import pprint

from papermerge.core import db, schemas, utils
from papermerge.core.db.users import get_user

app = typer.Typer(help="Basic JWT tokens management")
engine = db.get_engine()


@app.command()
def encode(username: str, scopes: str = None):
    """Encodes token payload for given username"""
    user: schemas.User = get_user(engine, username)
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
def decode(token: str):
    """Decode payload of given token"""
    if '.' in token:
        print("[red]Doesn't look like jwt token payload[/red]")
        print("JWT payload do not contain dots")
        return

    decoded_token_payload = utils.base64.decode(token)
    pprint(decoded_token_payload, expand_all=True)
