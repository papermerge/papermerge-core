import os
import uuid
from typing import Optional

import typer
from rich import print_json, print
from salinic import IndexRW, create_engine
from typing_extensions import Annotated

from papermerge.core import dbapi, schema
from papermerge.core.db.engine import Session
from papermerge.search.schema import FOLDER, PAGE, SearchIndex

app = typer.Typer(help="Index commands")

NodeIDsType = Annotated[Optional[list[uuid.UUID]], typer.Argument()]


@app.callback(name="index", invoke_without_command=True)
def index_cmd(node_ids: NodeIDsType = None, dry_run: bool = False):
    SEARCH_URL = os.environ.get("PAPERMERGE__SEARCH__URL")
    if not SEARCH_URL:
        print("[red][bold]PAPERMERGE__SEARCH__URL[/bold] is missing[/red]")
        print("Please set [bold]PAPERMERGE__SEARCH__URL[/bold] environment variable")
        raise typer.Exit(code=1)

    engine = create_engine(SEARCH_URL)
    index = IndexRW(engine, schema=SearchIndex)

    with Session() as db_session:
        nodes = dbapi.get_nodes(db_session, node_ids)
        items = []  # to be added to the index
        for node in nodes:
            if isinstance(node, schema.Document):
                last_ver = dbapi.get_last_doc_ver(
                    db_session, user_id=node.user_id, doc_id=node.id
                )
                pages = dbapi.get_doc_ver_pages(db_session, last_ver.id)
                for page in pages:
                    item = SearchIndex(
                        id=str(page.id),
                        title=node.title,
                        user_id=str(node.user_id),
                        document_id=str(node.id),
                        document_version_id=str(last_ver.id),
                        page_number=page.number,
                        text=page.text,
                        entity_type=PAGE,
                        tags=[tag.name for tag in node.tags],
                    )
                    items.append(item)
            else:
                item = SearchIndex(
                    id=str(node.id),
                    title=node.title,
                    user_id=str(node.user_id),
                    entity_type=FOLDER,
                    tags=[tag.name for tag in node.tags],
                )
                items.append(item)

        if dry_run:
            for item in items:
                print_json(data=item.model_dump())
        else:
            for item in items:
                index.add(item)
