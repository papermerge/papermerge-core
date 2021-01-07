import logging
import time

from django.conf import settings
from papermerge.core.storage import default_storage
from mglib.path import DocumentPath

import ocrmypdf

logger = logging.getLogger(__name__)

STARTED = "started"
COMPLETE = "complete"


def ocr_document(
    user_id,
    document_id,
    file_name,
    lang,
    namespace=None,
):
    logger.debug(f"OCR PDF document {user_id}/{document_id}")

    t1 = time.time()

    lang = lang.lower()
    doc_path = DocumentPath(
        user_id=user_id,
        document_id=document_id,
        file_name=file_name,
    )

    if not default_storage.exists(doc_path.url()):
        default_storage.download(
            doc_path_url=doc_path.url(),
            namespace=namespace
        )
    # FIXME: This will not work with a remote storage.
    try:
        logger.debug(f"  options={settings.PAPERMERGE_OCRMYPDF_OPTIONS}")
        ocrmypdf.ocr(
            default_storage.abspath(doc_path.url()),
            default_storage.abspath(doc_path.url()),
            use_threads=True,
            language=[lang],
            **settings.PAPERMERGE_OCRMYPDF_OPTIONS
        )
    except ocrmypdf.PriorOcrFoundError:
        pass

    t2 = time.time()
    logger.debug(
        f"  user_id={user_id} doc_id={document_id} total_exec_time={t2-t1:.2f}"
    )

    default_storage.upload(doc_path.url(), namespace=namespace)

    return True
