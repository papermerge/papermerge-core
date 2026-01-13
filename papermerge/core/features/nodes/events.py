import logging

from papermerge.celery_app import app as celery_app
from papermerge.core import constants as const
from papermerge.core import types
from papermerge.core.utils.decorators import if_redis_present
from .schema import DeleteDocumentsData
from papermerge.core.config import get_settings

settings = get_settings()
logger = logging.getLogger(__name__)


@if_redis_present
def delete_documents_s3_data(data: DeleteDocumentsData):
    if settings.storage_backend == types.StorageBackend.LOCAL.value:
        logger.debug("Nothing to do for local storage")
        return

    celery_app.send_task(
        const.S3_WORKER_REMOVE_DOC_VER,
        kwargs={"doc_ver_ids": [str(i) for i in data.document_version_ids]},
        route_name="s3",
    )
    celery_app.send_task(
        const.S3_WORKER_REMOVE_DOCS_THUMBNAIL,
        kwargs={"doc_ids": [str(i) for i in data.document_ids]},
        route_name="s3",
    )
    celery_app.send_task(
        const.S3_WORKER_REMOVE_PAGE_THUMBNAIL,
        kwargs={"page_ids": [str(i) for i in data.page_ids]},
        route_name="s3",
    )
