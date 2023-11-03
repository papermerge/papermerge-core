import logging
from typing import List

from celery import shared_task
from celery.signals import task_success
from django.conf import settings
from salinic import IndexRW, create_engine

from papermerge.core.constants import (INDEX_ADD_NODE, INDEX_ADD_PAGES,
                                       INDEX_REMOVE_NODE, INDEX_UPDATE)
from papermerge.core.models import (BaseTreeNode, Document, DocumentVersion,
                                    Page)
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
        logger.warning(f"Exception '{e}' occurred while opening engine")
        logger.warning(f"Index add for {node_id} interrupted")
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


@shared_task(name=INDEX_ADD_NODE)
def index_add_docs(doc_ids: List[str]):
    """Add list of documents to index"""
    try:
        # may happen when using xapian search backend and multiple
        # workers try to get write access to the index
        engine = create_engine(settings.SEARCH_URL)
    except Exception as e:
        logger.warning(f"Exception '{e}' occurred while opening engine")
        logger.warning(f"Index add for {doc_ids} interrupted")
        return

    index = IndexRW(engine, schema=Model)

    docs = Document.objects.filter(pk__in=doc_ids)

    for doc in docs:
        model = from_document(doc)
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


@shared_task(name=INDEX_ADD_PAGES)
def add_pages_to_index(page_ids: List[str]):
    try:
        # may happen when using xapian search backend and multiple
        # workers try to get write access to the index
        engine = create_engine(settings.SEARCH_URL)
    except Exception as e:
        logger.warning(f"Exception '{e}' occurred while opening engine")
        logger.warning(f"Index add for {page_ids} interrupted")
        return

    index = IndexRW(engine, schema=Model)
    index_entities = [from_page(page_id) for page_id in page_ids]

    for model in index_entities:
        index.add(model)


@shared_task(name=INDEX_UPDATE)
def update_index(add_ver_id: str, remove_ver_id: str):
    """Updates index

    Removes pages of `remove_ver_id` document version and adds
    pages of `add_ver_id` from/to index in one "transaction".
    """
    logger.debug(
        f"Index Update: add={add_ver_id}, remove={remove_ver_id}"
    )
    add_ver = None
    remove_ver = None
    try:
        add_ver = DocumentVersion.objects.get(pk=add_ver_id)
    except DocumentVersion.DoesNotExist:
        logger.debug(
            f"Index add doc version {add_ver_id} not found."
        )
    try:
        remove_ver = DocumentVersion.objects.get(pk=remove_ver_id)
    except DocumentVersion.DoesNotExist:
        logger.warning(f"Index remove doc version {remove_ver_id} not found")

    if add_ver:  # doc ver is there, but does it have pages?
        add_page_ids = [str(page.id) for page in add_ver.pages.all()]
        if len(add_page_ids) > 0:
            # doc ver is there and it has pages
            add_pages_to_index(add_page_ids)
        else:
            logger.debug("Empty page ids. Nothing to add to index")

    if remove_ver:  # doc ver is there, but does it have pages?
        remove_page_ids = [str(page.id) for page in remove_ver.pages.all()]
        if len(remove_page_ids) > 0:
            # doc ver is there and it has pages
            remove_folder_or_page_from_index(remove_page_ids)
        else:
            logger.debug("Empty page ids. Nothing to remove from index")


def from_page(page_id: str) -> Model:
    """Given page_id returns index entity"""
    page = Page.objects.get(pk=page_id)
    last_doc_ver = page.document_version
    doc = last_doc_ver.document

    if len(page.text) == 0 and last_doc_ver.number > 1:
        logger.warning(
            f"NO OCR TEXT FOUND! version={last_doc_ver.number} "
            f" title={doc.title}"
            f" page.number={page.number}"
            f" doc.ID={doc.id}"
        )

    index_entity = Model(
        id=str(page.id),
        title=doc.title,
        user_id=str(doc.user_id),
        document_id=str(doc.id),
        document_version_id=str(last_doc_ver.id),
        page_number=page.number,
        page_count=page.page_count,
        text=page.text,
        parent_id=str(doc.parent_id),
        entity_type=PAGE,
        tags=[
            ColoredTag(
                name=tag.name,
                fg_color=tag.fg_color,
                bg_color=tag.bg_color
            ) for tag in doc.tags.all()
        ],
        breadcrumb=[
            (str(item[0]), item[1]) for item in doc.breadcrumb
        ]
    )

    return index_entity


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


def from_document(node: BaseTreeNode | Document) -> List[Model]:
    result = []
    if isinstance(node, BaseTreeNode):
        doc = node.document
    else:
        doc = node  # i.e. node is instance of Document

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
