import typer

from papermerge.core.cli import perms as perms_cli
from papermerge.core.cli import scopes as scopes_cli
from papermerge.core.features.users.cli import cli as usr_cli
from papermerge.core.features.groups.cli import cli as groups_cli
from papermerge.core.cli import token as token_cli
from papermerge.search.cli import search
from papermerge.search.cli import index
from papermerge.search.cli import index_schema

app = typer.Typer(help="Papermerge DMS command line management tool")
app.add_typer(usr_cli.app, name="users")
app.add_typer(groups_cli.app, name="groups")
app.add_typer(perms_cli.app, name="perms")
app.add_typer(scopes_cli.app, name="scopes")
app.add_typer(token_cli.app, name="tokens")
app.add_typer(search.app, name="search")
app.add_typer(index.app, name="index")
app.add_typer(index_schema.app, name="index-schema")

if __name__ == "__main__":
    app()
