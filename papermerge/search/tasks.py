import logging

from celery import shared_task
from django.conf import settings
from salinic import Session, create_engine
from salinic.engine import AccessMode

from papermerge.core.models import BaseTreeNode
from papermerge.search.schema import FOLDER, ColoredTag, IndexEntity

logger = logging.getLogger(__name__)


@shared_task(name='index_add_folder')
def index_add_folder(node_id: str):
    """Add folder in the search index

    Add operation means either insert or update depending
    on if folder entity is already present in the index.
    In other words, if folder was already indexed (added before), its record
    in index will be updated otherwise its record will be inserted.
    """
    logger.debug(f'index_add_folder for node_id={node_id}')
    engine = create_engine(settings.SEARCH_URL, mode=AccessMode.RW)
    session = Session(engine)

    node = BaseTreeNode.objects.get(pk=node_id)
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

    if index_entity:
        logger.debug(f'session.add for {index_entity}')
        session.add(index_entity)
