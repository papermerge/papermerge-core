import logging
from typing import List

from celery import shared_task
from celery.signals import task_success
from django.conf import settings
from salinic import IndexRW, create_engine

from papermerge.core.constants import INDEX_ADD_NODE, INDEX_REMOVE_NODE
from papermerge.core.models import BaseTreeNode, DocumentVersion
from papermerge.core.tasks import ocr_document_task
from papermerge.search.schema import FOLDER, PAGE, ColoredTag, Model

logger = logging.getLogger(__name__)


@task_success.connect(sender=ocr_document_task)
def task_success_notifier(sender=None, **kwargs):
    """
    kwargs['result'] is node UUID i.e. (BaseTreeNode pk)
    """
    if kwargs.get('result', None) is None:
        logger.error("No result key found. Cannot add node to index.")
        return

    index_add_node(kwargs['result'])


@shared_task(name=INDEX_ADD_NODE)
def index_add_node(node_id: str):
    """Add node to the search index

    Add operation means either insert or update depending
    on if folder entity is already present in the index.
    In other words, if folder was already indexed (added before), its record
    in index will be updated otherwise its record will be inserted.
    """
    try:
        # may happen when using xapian search backend and multiple
        # workers try to get write access to the index
        engine = create_engine(settings.SEARCH_URL)
    except Exception as e:
        logger.warning(f"Exception '{e}' occured while opening engine")
        logger.warning(f"Index add for {node_id} interruped")
        return

    index = IndexRW(engine, schema=Model)

    node = BaseTreeNode.objects.get(pk=node_id)

    logger.debug(f'ADD node title={node.title} ID={node.id} to INDEX')

    if node.is_document:
        models = from_document(node)
    else:
        models = [from_folder(node)]

    for model in models:
        index.add(model)


@shared_task(name=INDEX_REMOVE_NODE)
def remove_folder_or_page_from_index(item_ids: List[str]):
    """Removes folder or page from search index
    """
    logger.debug(f'Removing folder or page {item_ids} from index')
    try:
        logger.debug(f'Creating engine {settings.SEARCH_URL}')
        engine = create_engine(settings.SEARCH_URL)
    except Exception as e:
        # may happen when using xapian search backend and multiple
        # workers try to get write access to the index
        logger.warning(f"Exception '{e}' occurred while opening engine")
        logger.warning(f"Index remove for {item_ids} interrupted")
        return

    index = IndexRW(engine, schema=Model)

    for item_id in item_ids:
        try:
            logger.debug(f'index remove {item_id}')
            index.remove(id=item_id)
        except Exception as exc:
            logger.error(exc)
            raise

    logger.debug('End of remove_folder_or_page_from_index')


def from_folder(node: BaseTreeNode) -> Model:
    index_entity = Model(
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


def from_document(node: BaseTreeNode) -> List[Model]:
    result = []
    doc = node.document
    last_ver: DocumentVersion = doc.versions.last()

    for page in last_ver.pages.all():
        if len(page.text) == 0 and last_ver.number > 1:
            logger.warning(
                f"NO OCR TEXT FOUND! version={last_ver.number} "
                f" title={doc.title}"
                f" page.number={page.number}"
                f" doc.ID={doc.id}"
                f" node.ID={node.id}"
            )

        index_entity = Model(
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
