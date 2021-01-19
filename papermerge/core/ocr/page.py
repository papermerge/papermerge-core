import os
import logging
import time

from django.conf import settings
from papermerge.core.storage import default_storage
from papermerge.core import signal_definitions as signals

from mglib import mime
from mglib.pdfinfo import get_pagecount
from mglib.path import (
    DocumentPath,
    PagePath,
)
from mglib.step import (Step, Steps)
from mglib.shortcuts import (
    extract_img,
    resize_img,
    extract_hocr,
    extract_txt,
)
from mglib.tiff import convert_tiff2pdf

logger = logging.getLogger(__name__)

STARTED = "started"
COMPLETE = "complete"


def notify_hocr_ready(page_path, **kwargs):
    """
    Notifies interested parties that .hocr file is available.

    Notifies via django signals. Among others will send
    hocr content itself. Input arguments:

    ``page_path``: mglib.PagePath instance of current page
    Following keys are expected to be availble in kwargs dictinary:

        * ``user_id``
        * ``document_id``
        * ``file_name``
        * ``page_num``
        * ``namespace``
        * ``step``

    Always returns None.

    Sent signals: ``post_page_hocr``.

    Following arguments are passed to the signal:
        * ``sender`` = from papermerge.core.signal_definitions.WORKER
        * ``user_id``
        * ``document_id``
        * ``file_name``
        * ``page_num``
        * ``lang``
        * ``namespace`` = may be empty. Used to distinguish among
            different tenants in multi-tenant deployments.
        * ``step`` = integer number corresponding to step
            learn more about steps in ``mglib.step.Step``
        * ``hocr`` = extracted hocr data (text format)
    """

    user_id = kwargs.get('user_id', None)
    document_id = kwargs.get('document_id', None)
    file_name = kwargs.get('file_name', None)
    page_num = kwargs.get('page_num', 1)
    namespace = kwargs.get('namespace', None)
    step = kwargs.get('step', 1)

    if page_path:
        abs_path_hocr = default_storage.abspath(page_path.hocr_url())

        if os.path.exists(abs_path_hocr):
            with open(abs_path_hocr) as f:
                hocr = f.read()

                signals.post_page_hocr.send(
                    sender=signals.WORKER,
                    user_id=user_id,
                    document_id=document_id,
                    file_name=file_name,
                    page_num=page_num,
                    step=step,
                    namespace=namespace,
                    hocr=hocr
                )
        else:
            logger.warning(
                f"Page hocr/step={step} path {abs_path_hocr} does not exist."
            )
    else:
        logger.warning(
            f"hOCR/step={step} method returned empty page path."
        )


def notify_txt_ready(page_path, **kwargs):
    """
    Notifies interested parties that .txt file is available.

    Notifies via django signals. Among others will send
    .txt content itself. Input arguments:

    ``page_path``: mglib.PagePath instance of current page
    Following keys are expected to be availble in kwargs dictinary:

        * ``user_id``
        * ``document_id``
        * ``file_name``
        * ``page_num``
        * ``namespace``

    Always returns None.

    Sent signals: ``post_page_txt``.

    Following arguments are passed to the signal:
        * ``sender`` = from papermerge.core.signal_definitions.WORKER
        * ``user_id``
        * ``document_id``
        * ``file_name``
        * ``page_num``
        * ``lang``
        * ``namespace`` = may be empty. Used to distinguish among
            different tenants in multi-tenant deployments.
        * ``txt`` = extracted .txt data (text format)
    """

    user_id = kwargs.get('user_id', None)
    document_id = kwargs.get('document_id', None)
    page_num = kwargs.get('page_num', 1)
    file_name = kwargs.get('file_name', None)
    namespace = kwargs.get('namespace', None)

    if page_path:
        abs_path_txt = default_storage.abspath(page_path.txt_url())

        if os.path.exists(abs_path_txt):
            with open(abs_path_txt) as f:
                text = f.read()

                signals.post_page_txt.send(
                    sender=signals.WORKER,
                    user_id=user_id,
                    document_id=document_id,
                    file_name=file_name,
                    page_num=page_num,
                    namespace=namespace,
                    text=text
                )
        else:
            logger.warning(
                f"Page txt path {abs_path_txt} does not exist. "
                f"Page indexing was skipped."
            )
    else:
        logger.warning(
            "OCR method returned empty page path. "
            "Page indexing was skipped."
        )


def ocr_page_pdf(
    doc_path,
    page_num,
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

    if page_num <= page_count:
        # first quickly generate preview images
        page_path = PagePath(
            document_path=doc_path,
            page_num=page_num,
            step=Step(1),
            page_count=page_count
        )
        for step in Steps():
            page_path.step = step
            extract_img(
                page_path,
                media_root=settings.MEDIA_ROOT
            )

    if page_num <= page_count:
        page_path = PagePath(
            document_path=doc_path,
            page_num=page_num,
            step=Step(1),
            page_count=page_count
        )
        extract_txt(
            page_path,
            lang=lang,
            media_root=settings.MEDIA_ROOT
        )
        notify_txt_ready(
            page_path,
            page_num=page_num,
            lang=lang,
            file_name=file_name,
            **kwargs
        )

        for step in Steps():
            page_path.step = step
            if not step.is_thumbnail:
                extract_hocr(
                    page_path,
                    lang=lang,
                    media_root=settings.MEDIA_ROOT
                )
                notify_hocr_ready(
                    page_path,
                    page_num=page_num,
                    lang=lang,
                    # step as integer number
                    step=step.current,
                    file_name=file_name,
                    **kwargs
                )

    return page_path


def ocr_page_image(
    doc_path,
    page_num,
    lang,
    **kwargs
):
    """
    image = jpg, jpeg, png

    On success returns ``mglib.path.PagePath`` instance.
    """
    logger.debug("OCR image (jpeg, jpg, png) document")

    page_path = PagePath(
        document_path=doc_path,
        page_num=page_num,
        step=Step(1),
        # jpeg, jpg, png are 1 page documents
        page_count=1
    )
    # resize and eventually convert (png -> jpg)
    resize_img(
        page_path,
        media_root=settings.MEDIA_ROOT
    )
    extract_txt(
        page_path,
        lang=lang,
        media_root=settings.MEDIA_ROOT
    )
    notify_txt_ready(
        page_path,
        page_num=page_num,
        lang=lang,
        file_name=doc_path.file_name,
        **kwargs
    )

    # First quickly generate preview images
    for step in Steps():
        page_path.step = step
        resize_img(
            page_path,
            media_root=settings.MEDIA_ROOT
        )
    # reset page's step
    page_path.step = Step(1)
    # Now OCR each image
    for step in Steps():
        if not step.is_thumbnail:
            extract_hocr(
                page_path,
                lang=lang,
                media_root=settings.MEDIA_ROOT
            )
            notify_hocr_ready(
                page_path,
                page_num=page_num,
                lang=lang,
                # step as integer number
                step=step.current,
                file_name=doc_path.file_name,
                **kwargs
            )

    return page_path


def ocr_page(
    user_id,
    document_id,
    file_name,
    page_num,
    lang,
    namespace=None,
):
    logger.debug(
        f" ocr_page user_id={user_id} doc_id={document_id}"
        f" page_num={page_num}"
    )
    t1 = time.time()
    lang = lang.lower()
    doc_path = DocumentPath(
        user_id=user_id,
        document_id=document_id,
        file_name=file_name,
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

    page_type = ''

    if mime_type.is_pdf():
        ocr_page_pdf(
            doc_path=doc_path,
            page_num=page_num,
            lang=lang,
            user_id=user_id,
            document_id=document_id,
            namespace=namespace
        )
        page_type = 'pdf'
    elif mime_type.is_image():  # jpeg, jpeg or png
        ocr_page_image(
            doc_path=doc_path,
            page_num=page_num,
            lang=lang,
            user_id=user_id,
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
        ocr_page_pdf(
            doc_path=doc_path,
            page_num=page_num,
            lang=lang,
            user_id=user_id,
            document_id=document_id,
            # Pass original file_name i.e. tiff file name as well.
            file_name=orig_file_name,
            namespace=namespace
        )
    else:
        logger.error(
            f" user_id={user_id}"
            f" doc_id={document_id}"
            f" page_num={page_num} error=Unkown file type"
        )
        return True

    t2 = time.time()
    logger.debug(
        f" user_id={user_id} doc_id={document_id}"
        f" page_num={page_num} page_type={page_type}"
        f" total_exec_time={t2-t1:.2f}"
    )

    return True
