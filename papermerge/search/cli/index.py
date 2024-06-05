import uuid

import typer
from django.conf import settings
from salinic import IndexRO, create_engine

from papermerge.core.models import BaseTreeNode
from papermerge.search.schema import Model

app = typer.Typer(help="Index documents")

engine = create_engine(settings.SEARCH_URL)
index = IndexRO(engine, schema=Model)


@app.command()
def index_cmd(
    node_ids: list[uuid.UUID] | None = None,
    dry_run: bool = False
):
    if node_ids:
        nodes = BaseTreeNode.objects.filter(pk__in=node_ids)
    else:
        nodes = BaseTreeNode.objects.all()

    for node in nodes:
        pass
