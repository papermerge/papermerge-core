import io
import logging
import uuid
from typing import List
from uuid import UUID

from celery import shared_task
from django.utils.translation import gettext_lazy as _

from papermerge.core.models import User
from papermerge.core.ocr.document import ocr_document

from .models import Document, DocumentVersion, Folder, Page

logger = logging.getLogger(__name__)


@shared_task
def delete_user_data(user_id):
    try:
        user = User.objects.get(id=user_id)
        # first delete all files associated with the user
        user.delete_user_data()
        # then delete the user DB entry
        user.delete()
    except User.DoesNotExist:
        logger.info(f"User: {user_id} already deleted")


@shared_task(acks_late=True, reject_on_worker_lost=True)
def ocr_document_task(
    document_id,
    lang,
    user_id  # !!! Important, DO NOT REMOVE
):
    """
    OCRs the document.

    ** Attention! Attention! **
    Arguments of this method correspond to the:

    ``papermerge.core.notif.events.OCREvent``

    Which means, even if ``user_id`` is not used here, it MUST be part
    of arg list, otherwise ``papermerge.core.signals.channel_group_notify``
    will "interrupt without a trace" because ``Event`` model
    validation will fail (as ``OCREvent`` won't have ``user_id``).

    Anyway, DO NOT REMOVE ``user_id`` argument!

    ** End of Attention! Attention! **

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
    doc_version = doc.versions.last()

    logger.debug(
        'OCR START'
        f' doc.title={doc.title} doc.id={document_id} lang={lang}'
    )

    target_docver_uuid = uuid.uuid4()
    target_page_uuids = [
        uuid.uuid4() for _ in range(doc_version.pages.count())
    ]

    ocr_document(
        document_version=doc_version,
        lang=lang,
        target_docver_uuid=target_docver_uuid,
        target_page_uuids=target_page_uuids
    )

    logger.debug(
        'OCR COMPLETE'
        f' doc.title={doc.title} doc.id={document_id} lang={lang}'
    )

    _post_ocr_document(
        document_id,
        target_docver_uuid=target_docver_uuid,
        target_page_uuids=target_page_uuids,
        lang=lang
    )

    logger.debug(
        'POST OCR COMPLETE'
        f' doc.title={doc.title} doc.id={document_id} lang={lang}'
    )

    return document_id


def _post_ocr_document(
    document_id: str,
    target_docver_uuid: UUID,
    target_page_uuids: List[UUID],
    lang: str
):
    """
    Task to run immediately after document OCR is complete.

    This task guarantees that `increment_document_version` will run
    before `update_document_pages`.
    """
    logger.debug(f'post_ocr_task_task doc_id={document_id}')

    increment_document_version(
        document_id,
        target_docver_uuid,
        target_page_uuids,
        lang
    )
    update_document_pages(document_id)

    return document_id


def increment_document_version(
    document_id,
    target_docver_uuid: UUID,
    target_page_uuids: List[UUID],
    lang: str
):
    logger.debug(
        'increment_document_version: '
        f'document_id={document_id}'
    )
    doc = Document.objects.get(pk=document_id)
    doc_version = doc.versions.last()

    new_doc_version = DocumentVersion(
        id=target_docver_uuid,   # important!
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
        f' document_id={document_id} '
        f' lang={lang}'
    )

    for page_number in range(1, new_doc_version.page_count + 1):
        Page.objects.create(
            id=target_page_uuids[page_number - 1],
            document_version=new_doc_version,
            number=page_number,
            page_count=new_doc_version.page_count,
            lang=lang
        )


def update_document_pages(document_id):
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
    doc = Document.objects.get(pk=document_id)
    doc_version = doc.versions.last()
    streams = []

    for page in doc_version.pages.order_by('number'):
        if page.txt_path.exists():
            streams.append(open(page.txt_path))
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
    Normalize pages. The normalization was triggered model origin.
    Origin can be either a Folder or a Document
    """
    if isinstance(origin, Document):
        norm_pages_from_doc(origin)
    elif isinstance(origin, Folder):
        norm_pages_from_folder(origin)
