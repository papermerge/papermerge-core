import os

import typer
from salinic import IndexRO, Search, create_engine

from papermerge.search.schema import SearchIndex as Index

app = typer.Typer(help="Search documents")

SEARCH_URL = os.environ.get('PAPERMERGE__SEARCH__URL')
if not SEARCH_URL:
    raise ValueError("missing PAPERMERGE__SEARCH__URL")

engine = create_engine(SEARCH_URL)
index = IndexRO(engine, schema=Index)


@app.command()
def search_cmd(
    q: str
):
    sq = Search(Index).query(q)

    for entity in index.search(sq):
        print(entity.model_dump())
