import os
import uuid
from typing import Optional

import typer
from rich import print_json
from salinic import IndexRW, create_engine
from typing_extensions import Annotated

from papermerge.core import db, schemas
from papermerge.search.schema import FOLDER, PAGE, Model

app = typer.Typer(help="Index documents")

SEARCH_URL = os.environ.get('PAPERMERGE__SEARCH__URL')
if not SEARCH_URL:
    raise ValueError("missing PAPERMERGE__SEARCH__URL")

engine = create_engine(SEARCH_URL)
index = IndexRW(engine, schema=Model)
db_session = db.get_session()

NodeIDsType = Annotated[
    Optional[list[uuid.UUID]],
    typer.Argument()
]


@app.command()
def index_cmd(
    node_ids: NodeIDsType = None,
    dry_run: bool = False
):
    nodes = db.get_nodes(db_session, node_ids)
    items = []  # to be added to the index
    for node in nodes:
        if isinstance(node, schemas.Document):
            last_ver = db.get_last_doc_ver(
                db_session,
                user_id=node.user_id,
                doc_id=node.id
            )
            pages = db.get_doc_ver_pages(db_session, last_ver.id)
            for page in pages:
                item = Model(
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
            item = Model(
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
