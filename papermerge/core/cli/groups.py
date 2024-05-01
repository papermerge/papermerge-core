import typer

from papermerge.core import db
from papermerge.core.auth import scopes

app = typer.Typer(help="Groups basic management")


@app.command()
def create_admin():
    """Creates group named 'admin' containing all permissions"""
    db_session = db.get_session()
    all_scopes = [name for name, _ in scopes.SCOPES.items()]
    db.create_group(
        db_session,
        name='admin',
        scopes=all_scopes
    )
