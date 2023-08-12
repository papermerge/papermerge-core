import logging
from typing import List

from celery import shared_task
from django.conf import settings
from salinic import Session, create_engine
from salinic.engine import AccessMode

from papermerge.core.constants import INDEX_ADD_NODE
from papermerge.core.models import BaseTreeNode
from papermerge.search.schema import FOLDER, PAGE, ColoredTag, IndexEntity

logger = logging.getLogger(__name__)


def from_folder(node: BaseTreeNode) -> IndexEntity:
    index_entity = IndexEntity(
        id=str(node.id),
        title=node.title,
        user_id=str(node.user_id),
        entity_type=FOLDER,
        parent_id=str(node.parent_id),
        tags=[
            ColoredTag(
                name=tag.name,
                fg_color=tag.fg_color,
                bg_color=tag.bg_color
            ) for tag in node.tags.all()
        ],
        breadcrumb=[
            (str(item[0]), item[1]) for item in node.breadcrumb
        ]
    )

    return index_entity


def from_document(node: BaseTreeNode) -> List[IndexEntity]:
    result = []
    doc = node.document
    last_ver = doc.versions.last()

    for page in last_ver.pages.all():
        index_entity = IndexEntity(
            id=str(page.id),
            title=node.title,
            user_id=str(node.user_id),
            document_id=str(node.document.id),
            document_version_id=str(last_ver.id),
            page_number=page.number,
            page_count=page.page_count,
            text=page.text,
            parent_id=str(node.parent_id),
            entity_type=PAGE,
            tags=[
                ColoredTag(
                    name=tag.name,
                    fg_color=tag.fg_color,
                    bg_color=tag.bg_color
                ) for tag in node.tags.all()
            ],
            breadcrumb=[
                (str(item[0]), item[1]) for item in node.breadcrumb
            ]
        )
        result.append(index_entity)

    return result


@shared_task(name=INDEX_ADD_NODE)
def index_add_node(node_id: str):
    """Add folder in the search index

    Add operation means either insert or update depending
    on if folder entity is already present in the index.
    In other words, if folder was already indexed (added before), its record
    in index will be updated otherwise its record will be inserted.
    """
    engine = create_engine(settings.SEARCH_URL, mode=AccessMode.RW)
    session = Session(engine)

    node = BaseTreeNode.objects.get(pk=node_id)
    if node.is_document:
        index_entities = from_document(node)
    else:
        index_entities = [from_folder(node)]

    for entity in index_entities:
        session.add(entity)
