import io
import os
import logging

from django.utils.translation import gettext_lazy as _

from celery import shared_task
from papermerge.core.ocr.document import ocr_document
from papermerge.core.storage import abs_path, get_storage_instance

from .models import (
    Document,
    DocumentVersion,
    Folder,
    Page
)

logger = logging.getLogger(__name__)


@shared_task
def delete_user_data(user_id):
    """Delete ALL associated user data (invoked when user is deleted)"""
    logger.debug(f'Deleting user {user_id} storage data')
    storage = get_storage_instance()
    storage.delete_user_data(user_id=user_id)


@shared_task(acks_late=True, reject_on_worker_lost=True)
def ocr_document_task(
    document_id,
    lang,
    user_id,  # UUID of the user who initiated OCR of the document
    namespace=None
):
    """
    OCRs the document.

    On success returns ``document_id``
    If something went wrong returns ``None``.

    Returning ``document_id`` on success crucial, as ``ocr_document_task``
    is chained with other celery tasks which will receive as
    first argument returned value of this task (i.e. ``document_id``).

    If you use `acks_late` then the worker will remove the item from the queue
    at the end of the task rather than the beginning.
    However, if the worker process is killed the task is still acknowledged even
    if it wasn't completed. `reject_on_worker_lost` will re-queue the message
    if the above event happens so you won't lose the task.
    """
    doc = Document.objects.get(pk=document_id)
    user_id = doc.user.id
    doc_version = doc.versions.last()

    logger.debug(
        'ocr_document_task: ocr start'
        f'document_id={document_id} namespace={namespace} '
        f'lang={lang}'
    )

    ocr_document(
        user_id=user_id,
        document_id=document_id,
        file_name=doc_version.file_name,
        lang=lang,
        namespace=namespace,
        version=doc_version.number,
        target_version=doc_version.number + 1
    )

    logger.debug(
        'ocr_document_task: ocr end'
        f'document_id={document_id} namespace={namespace} '
        f'lang={lang}'
    )

    logger.debug(
        'ocr_document_task: successfully complete'
        f'document_id={document_id} namespace={namespace} '
        f'lang={lang}'
    )

    return document_id


@shared_task
def post_ocr_document_task(document_id, namespace=None):
    """
    Task to run immediately after document OCR is complete

    This task guarantees that `increment_document_version` will run
    before `update_document_pages`.
    """
    logger.debug(f'post_ocr_task_task doc_id={document_id}')

    increment_document_version(document_id, namespace)
    update_document_pages(document_id, namespace)

    # generate previews for newly created document version (which has OCR)
    doc = Document.objects.get(pk=document_id)
    doc_version = doc.versions.last()

    generate_page_previews_task.delay(str(doc_version.id))

    return document_id


@shared_task
def generate_page_previews_task(document_version_id):
    document_version = DocumentVersion.objects.get(id=document_version_id)

    doc = document_version.document
    logger.debug(f"Generating previews doc_id={doc.id}")

    document_version.generate_previews()

    return document_version_id


def increment_document_version(document_id, namespace=None):
    logger.debug(
        'increment_document_version: '
        f'document_id={document_id} namespace={namespace}'
    )

    doc = Document.objects.get(pk=document_id)
    lang = doc.lang
    doc_version = doc.versions.last()

    new_doc_version = DocumentVersion(
        document=doc,
        number=doc_version.number + 1,
        file_name=doc_version.file_name,
        size=0,  # TODO: set to newly created file size
        page_count=doc_version.page_count,
        lang=lang,
        short_description=_("with OCRed text layer")
    )
    new_doc_version.save()

    logger.debug(
        'ocr_document_task: creating pages'
        f'document_id={document_id} namespace={namespace} '
        f'lang={lang}'
    )

    for page_number in range(1, new_doc_version.page_count + 1):
        Page.objects.create(
            document_version=new_doc_version,
            number=page_number,
            page_count=new_doc_version.page_count,
            lang=lang
        )


def update_document_pages(document_id, namespace=None):
    """
    Updates document latest versions's ``text`` field

    ``text`` field is updated on the last document version instance
    as well as on each of last document versions' page.

    In case when a particular file with ``page.txt_url`` does not exist,
    page content (to the precise, the lack of page content) will
    be replaced with empty string (io.String('')).

    In particular when no OCR was performed yet each individual
    page as well as document versions's ``text`` fields will be
    updated with empty strings.
    """

    logger.debug(
        'update_document_pages: '
        f'document_id={document_id} namespace={namespace}'
    )

    doc = Document.objects.get(pk=document_id)
    doc_version = doc.versions.last()
    streams = []

    for page in doc_version.pages.order_by('number'):
        url = abs_path(page.txt_url)
        if os.path.exists(url):
            streams.append(open(url))
        else:
            streams.append(io.StringIO(''))

    doc_version.update_text_field(streams)


def norm_pages_from_doc(document):
    logger.debug(f"Normalizing document {document.id}")
    for page in Page.objects.filter(document=document):
        page.norm()


def norm_pages_from_folder(folder):
    for descendent in folder.get_descendants():
        if isinstance(descendent, Document):
            norm_pages_from_doc(descendent)
        elif isinstance(descendent, Folder):
            norm_pages_from_folder(descendent)
        else:
            raise ValueError("Unexpected value for descendent instance")


@shared_task
def normalize_pages(origin):
    """
    Normalize Pages. The normalization was triggered model origin.
    origin can be either a Folder or a Document
    """
    if isinstance(origin, Document):
        norm_pages_from_doc(origin)
    elif isinstance(origin, Folder):
        norm_pages_from_folder(origin)
