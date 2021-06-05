import logging
import time

from django.conf import settings

import ocrmypdf

from papermerge.core.storage import default_storage
from papermerge.core.lib import mime
from papermerge.core.lib.pagecount import get_pagecount
from papermerge.core.lib.shortcuts import (
    extract_img,
    resize_img,
    extract_hocr,
    extract_txt,
)
from papermerge.core.lib.tiff import convert_tiff2pdf
from papermerge.core.lib.step import (Step, Steps)
from papermerge.core.lib.path import (
    DocumentPath,
    PagePath,
)


logger = logging.getLogger(__name__)

STARTED = "started"
COMPLETE = "complete"


def notify_hocr_ready(page_path, **kwargs):
    pass


def notify_txt_ready(page_path, **kwargs):
    pass


def notify_pre_page_ocr(page_path, **kwargs):
    pass


def _ocr_document(
    doc_path,
    lang,
    **kwargs
):
    """
    doc_path is an mglib.path.DocumentPath instance

    On success returns ``mglib.path.PagePath`` instance.
    """
    logger.debug("OCR PDF document")

    file_name = kwargs.pop('file_name', None)

    if not file_name:
        file_name = doc_path.file_name

    page_count = get_pagecount(
        default_storage.abspath(doc_path.url())
    )

    ocrmypdf.ocr(
        doc_path,
        output_document,
        lang=lang,
        plugins=["ocrmypdf_papermerge.plugin"],
        progress_bar=False,
        pdf_renderer='hocr',
        use_threads=False,
        keep_temporary_files=False,
        output_dir=output_dir,
        output_format='svg',
        preview_width=preview_width
    )


def ocr_document(
    user_id,
    document_id,
    file_name,
    lang,
    version,
    namespace='',
):
    logger.debug(
        f" ocr_page user_id={user_id} doc_id={document_id}"
    )
    t1 = time.time()
    lang = lang.lower()
    doc_path = DocumentPath(
        user_id=user_id,
        document_id=document_id,
        file_name=file_name,
        version=version
    )

    if not default_storage.exists(doc_path.url()):
        # In case of distibuted deployment, document uploaded
        # by webapp is not directly available to the worker (which runs on
        # separate computer). Thus, if document is not locally available,
        # worker will download the document from whatever remote location.
        default_storage.download(
            doc_path_url=doc_path.url(),
            namespace=namespace
        )

    mime_type = mime.Mime(
        default_storage.abspath(doc_path.url())
    )
    logger.debug(f"Mime Type = {mime_type}")

    if mime_type.is_pdf() or mime_type.is_image():
        _ocr_document(
            doc_path=doc_path,
            lang=lang,
            user_id=user_id,
            version=version,
            document_id=document_id,
            namespace=namespace
        )
    elif mime_type.is_tiff():
        # new filename is a pdf file
        logger.debug("TIFF type detected")
        new_filename = convert_tiff2pdf(
            doc_url=default_storage.abspath(doc_path.url())
        )
        # now .pdf
        orig_file_name = doc_path.file_name
        doc_path.file_name = new_filename
        # and continue as usual
        _ocr_document(
            doc_path=doc_path,
            lang=lang,
            user_id=user_id,
            document_id=document_id,
            # Pass original file_name i.e. tiff file name as well.
            file_name=orig_file_name,
            namespace=namespace,
            version=version
        )
    else:
        logger.error(
            f" user_id={user_id}"
            f" doc_id={document_id}"
        )
        return True

    t2 = time.time()
    logger.debug(
        f" user_id={user_id} doc_id={document_id}"
        f" total_exec_time={t2-t1:.2f}"
    )

    return True
