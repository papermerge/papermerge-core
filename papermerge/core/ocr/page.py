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


def upload_to(page_path, **kwargs):
    """
    Will upload results to remote storage if such storage
    is supported.

    Default storage class ``mglib.storage.FileSystemStorage``
    ``download`` and ``upload`` methods are empty.

    Method is useful for cloud production (where storage class
    will be replaced to support remote storage e.g. S3, SFTP)
    """
    default_storage.upload(page_path.txt_url(), **kwargs)

    for step in Steps():
        if not step.is_thumbnail:

            page_path.step = step
            default_storage.upload(page_path.hocr_url(), **kwargs)
            default_storage.upload(page_path.img_url(), **kwargs)


def ocr_page_pdf(
    doc_path,
    page_num,
    lang
):
    """
    doc_path is an mglib.path.DocumentPath instance

    On success returns ``mglib.path.PagePath`` instance.
    """
    logger.debug("OCR PDF document")

    page_count = get_pagecount(
        default_storage.abspath(doc_path.url())
    )

    if page_num <= page_count:
        # first quickly generate preview images
        page_url = PagePath(
            document_path=doc_path,
            page_num=page_num,
            step=Step(1),
            page_count=page_count
        )
        for step in Steps():
            page_url.step = step
            extract_img(
                page_url,
                media_root=settings.MEDIA_ROOT
            )

    if page_num <= page_count:
        page_url = PagePath(
            document_path=doc_path,
            page_num=page_num,
            step=Step(1),
            page_count=page_count
        )
        extract_txt(
            page_url,
            lang=lang,
            media_root=settings.MEDIA_ROOT
        )

        for step in Steps():
            page_url.step = step
            if not step.is_thumbnail:
                extract_hocr(
                    page_url,
                    lang=lang,
                    media_root=settings.MEDIA_ROOT
                )

    return page_url


def ocr_page_image(
    doc_path,
    page_num,
    lang
):
    """
    image = jpg, jpeg, png

    On success returns ``mglib.path.PagePath`` instance.
    """
    logger.debug("OCR image (jpeg, jpg, png) document")

    page_url = PagePath(
        document_path=doc_path,
        page_num=page_num,
        step=Step(1),
        # jpeg, jpg, png are 1 page documents
        page_count=1
    )
    # resize and eventually convert (png -> jpg)
    resize_img(
        page_url,
        media_root=settings.MEDIA_ROOT
    )
    extract_txt(
        page_url,
        lang=lang,
        media_root=settings.MEDIA_ROOT
    )

    # First quickly generate preview images
    for step in Steps():
        page_url.step = step
        resize_img(
            page_url,
            media_root=settings.MEDIA_ROOT
        )
    # reset page's step
    page_url.step = Step(1)
    # Now OCR each image
    for step in Steps():
        if not step.is_thumbnail:
            extract_hocr(
                page_url,
                lang=lang,
                media_root=settings.MEDIA_ROOT
            )

    return page_url


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
        default_storage.download(
            doc_path_url=doc_path.url(),
            namespace=namespace
        )

    mime_type = mime.Mime(
        default_storage.abspath(doc_path.url())
    )
    logger.debug(f"Mime Type = {mime_type}")

    page_type = ''
    page_path = None

    if mime_type.is_pdf():
        page_path = ocr_page_pdf(
            doc_path=doc_path,
            page_num=page_num,
            lang=lang
        )
        page_type = 'pdf'
    elif mime_type.is_image():  # jpeg, jpeg or png
        page_path = ocr_page_image(
            doc_path=doc_path,
            page_num=page_num,
            lang=lang
        )
    elif mime_type.is_tiff():
        # new filename is a pdf file
        logger.debug("TIFF type detected")
        new_filename = convert_tiff2pdf(
            doc_url=default_storage.abspath(doc_path.url())
        )
        # now .pdf
        doc_path.file_name = new_filename
        # and continue as usual
        page_path = ocr_page_pdf(
            doc_path=doc_path,
            page_num=page_num,
            lang=lang
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

    if page_path:
        abs_path_txt = default_storage.abspath(page_path.txt_url())

        if os.path.exists(abs_path_txt):

            with open(abs_path_txt) as f:
                text = f.read()

                signals.post_page_ocr.send(
                    sender="worker",
                    user_id=user_id,
                    document_id=document_id,
                    page_num=page_num,
                    lang=lang,
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

    upload_to(
        page_path=page_path,
        namespace=namespace
    )

    return True
