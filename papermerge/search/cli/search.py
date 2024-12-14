import os
import uuid

import typer
from salinic import IndexRO, Search, create_engine
from rich import print
from papermerge.search.schema import SearchIndex as Index

app = typer.Typer(help="Search command")


@app.callback(name="search", invoke_without_command=True)
def search_cmd(
    query: str, user_id: uuid.UUID, page_number: int = 1, page_size: int = 10
):
    SEARCH_URL = os.environ.get("PAPERMERGE__SEARCH__URL")
    if not SEARCH_URL:
        print("[red][bold]PAPERMERGE__SEARCH__URL[/bold] is missing[/red]")
        print("Please set [bold]PAPERMERGE__SEARCH__URL[/bold] environment variable")
        raise typer.Exit(code=1)

    engine = create_engine(SEARCH_URL)
    index = IndexRO(engine, schema=Index)

    sq = Search(Index).query(query, page_number=page_number, page_size=page_size)

    results = index.search(sq, user_id=str(user_id))
    print(results)
