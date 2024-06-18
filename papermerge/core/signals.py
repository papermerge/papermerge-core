import logging
from pathlib import Path

from celery.app import default_app as celery_app
from celery.signals import (heartbeat_sent, task_postrun, task_prerun,
                            task_received, worker_ready, worker_shutdown)
from django.conf import settings
from django.db.models.signals import post_delete, post_save, pre_delete
from django.dispatch import receiver

from papermerge.core import constants as const
from papermerge.core.models import Document, DocumentVersion, Page, User
from papermerge.core.notif import (Event, EventName, OCREvent, State,
                                   notification)
from papermerge.core.storage import get_storage_instance

from .signal_definitions import document_post_upload
from .tasks import delete_user_data as delete_user_data_task

logger = logging.getLogger(__name__)

# Tasks that need to notify websocket clients

HEARTBEAT_FILE = Path("/tmp/worker_heartbeat")
READINESS_FILE = Path("/tmp/worker_ready")


MONITORED_TASKS = (
    'papermerge.core.tasks.ocr_document_task',
)

MONITORED_TASKS_KWARGS_TYPE_DICT = {
    'papermerge.core.tasks.ocr_document_task': OCREvent
}


def update_document_ocr_status(event: Event) -> None:
    if not event:
        return

    if event.name != EventName.ocr_document:
        return

    document_id = event.kwargs.document_id
    ocr_status = event.state
    logger.debug(f"Updating document {document_id} ocr_status={ocr_status}")

    try:
        document = Document.objects.get(pk=document_id)
        document.ocr_status = ocr_status
        document.save()
    except Document.DoesNotExist as exc:
        # not end of the world, but still good to know
        logger.warning(
            f"Consumer did not found the document_id={document_id}"
        )
        logger.warning(exc)
        # life goes on...


def channel_group_notify(
    full_name: str,
    state: State,
    **kwargs
) -> Event | None:
    """
    Send group notification to the channel
    """
    logger.debug("channel_group_notify")
    if full_name in MONITORED_TASKS:
        logger.debug(
            f"full_name={full_name} state={state}"
            f" kwargs={kwargs}"
        )
        logger.debug("Before creation of the Event")
        # Validation failures WON'T BE REPORTED in
        # ``papermerge.core`` logger !!!
        # Validation failures are reported only in ``root``
        # logger
        event = Event(
            name=full_name.split('.')[-1],
            state=state,
            kwargs=kwargs['kwargs']
        )
        logger.debug(f"Before pushing the event: {event}")
        notification.push(event)
        logger.debug(f"After  pushing the event: {event}")

        return event


@task_prerun.connect
def channel_group_notify_task_prerun(sender=None, **kwargs):
    if not sender:
        return

    event = channel_group_notify(
        full_name=sender.name,
        state=State.started,
        kwargs=kwargs['kwargs']
    )

    update_document_ocr_status(event)


@task_postrun.connect
def channel_group_notify_task_postrun(sender=None, **kwargs):
    if not sender:
        return

    event = channel_group_notify(
        full_name=sender.name,
        state=kwargs['state'],
        kwargs=kwargs['kwargs']
    )

    update_document_ocr_status(event)


@task_received.connect
def channel_group_notify_task_received(sender=None, **kwargs):
    # why here is ``requests`` instead of ``sender``?
    logger.debug(f"Task notification received kwargs={kwargs}")
    request = kwargs.get('request')
    if not request:
        logger.debug("Empty request. Bye Bye.")
        return

    event = channel_group_notify(
        full_name=request.name,
        state=State.received,
        kwargs=request.kwargs
    )

    update_document_ocr_status(event)


@receiver(pre_delete, sender=Document)
def delete_files(sender, instance: Document, **kwargs):
    """
    Deletes physical (e.g. pdf) file associated
    with given (Document) instance.

    More exactly it will delete whatever it is inside
    associated folder in which original file was saved
    (e.g. all preview images).
    """
    for folder_path in instance.files_iter:
        try:
            get_storage_instance().delete_file(
                folder_path
            )
        except IOError as error:
            logger.error(
                f"Error deleting associated file for document.pk={instance.pk}"
                f" {error}"
            )


@receiver(pre_delete, sender=Document)
def s3_delete(sender, instance: Document, **kwargs):
    if settings.TESTING:
        return

    ids = [str(v.id) for v in instance.versions.all()]
    page_ids = [
        str(p.id) for p in Page.objects.filter(document_version_id__in=ids)
    ]

    logger.debug(
        f"Sending {const.S3_WORKER_REMOVE_DOC_VER} task doc_ver_ids={ids}"
    )
    celery_app.send_task(
        const.S3_WORKER_REMOVE_DOC_VER,
        kwargs={'doc_ver_ids': ids},
        route_name='s3',
    )
    celery_app.send_task(
        const.S3_WORKER_REMOVE_DOC_THUMBNAIL,
        kwargs={'doc_id': str(instance.id)},
        route_name='s3',
    )
    celery_app.send_task(
        const.S3_WORKER_REMOVE_PAGE_THUMBNAIL,
        kwargs={'page_ids': page_ids},
        route_name='s3',
    )


@receiver(post_delete, sender=User)
def delete_user_data(sender, instance, **kwargs):
    """Deletes associated user folder(s) under media root"""
    delete_user_data_task.delay(str(instance.pk))


@receiver(post_save, sender=User)
def user_init(sender, instance, created, **kwargs):
    """
    Signal sent when user model is saved
    (create=True if user was actually created).
    Create user specific data when user is initially created
    """
    if created:
        if settings.PAPERMERGE_CREATE_SPECIAL_FOLDERS:
            instance.create_special_folders()


@heartbeat_sent.connect
def heartbeat(**_):
    # liveness probe for celery worker
    # https://github.com/celery/celery/issues/4079
    HEARTBEAT_FILE.touch()


@worker_ready.connect
def worker_ready(**_):
    # readyness probe for celery worker
    # https://github.com/celery/celery/issues/4079
    READINESS_FILE.touch()


@worker_shutdown.connect
def worker_shutdown(**_):
    # https://github.com/celery/celery/issues/4079
    for file in (HEARTBEAT_FILE, READINESS_FILE):
        if file.is_file():
            file.unlink()


@receiver(document_post_upload, sender=Document)
def s3_upload(
    sender,
    document_version: DocumentVersion,
    **_
):
    if settings.TESTING:
        return

    doc_ver = document_version
    logger.debug(
        f"Sending {const.S3_WORKER_ADD_DOC_VER} doc_ver_id={doc_ver.id}"
    )
    celery_app.send_task(
        const.S3_WORKER_ADD_DOC_VER,
        kwargs={'doc_ver_ids': [str(doc_ver.id)]},
        route_name='s3',
    )


@receiver(document_post_upload, sender=Document)
def update_index(
    sender,
    document_version: DocumentVersion,
    **_
):
    if settings.TESTING:
        return

    doc = document_version.document
    logger.debug(
        f"Sending {const.INDEX_ADD_DOCS} doc_id={doc.id}"
    )
    celery_app.send_task(
        const.INDEX_ADD_DOCS,
        kwargs={'doc_ids': [str(doc.id)]},
        route_name='i3',
    )


@receiver(document_post_upload, sender=Document)
def receiver_document_post_upload(
    sender,
    document_version: DocumentVersion,
    **_
):
    """
    Triggers document OCR if automatic OCR is on.

    Arguments:
        document - instance of associated document model
        document_version - instance of newly created document version
    """
    doc = document_version.document

    if not doc.ocr:
        logger.info(f"Skipping OCR for doc={doc} as doc.ocr=False")
        return

    send_ocr_task(doc)


def send_ocr_task(doc: Document):
    celery_app.send_task(
        const.WORKER_OCR_DOCUMENT,
        kwargs={
            'document_id': str(doc.id),
            'lang': doc.lang,
        },
        route_name='ocr'
    )
