import os

import typer
from rich import print_json
from salinic import IndexRO, Search, create_engine

from papermerge.search.schema import Model

app = typer.Typer(help="Search documents")

SEARCH_URL = os.environ.get('PAPERMERGE__SEARCH__URL')
if not SEARCH_URL:
    raise ValueError("missing PAPERMERGE__SEARCH__URL")

engine = create_engine(SEARCH_URL)
index = IndexRO(engine, schema=Model)


@app.command()
def search_cmd(
    q: str
):
    sq = Search(Model).query(q)

    for entity in index.search(sq):
        print_json(data=entity.model_dump())
