import logging
import time

from django.conf import settings

from papermerge.core.storage import default_storage

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
    pass


def notify_txt_ready(page_path, **kwargs):
    pass


def notify_pre_page_ocr(page_path, **kwargs):
    pass


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

    notify_pre_page_ocr(
        page_path,
        page_num=page_num,
        lang=lang,
        file_name=doc_path.file_name,
        **kwargs
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
    notify_pre_page_ocr(
        page_path,
        page_num=page_num,
        lang=lang,
        file_name=doc_path.file_name,
        **kwargs
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
    version,
    namespace='',
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

    page_type = ''

    if mime_type.is_pdf():
        ocr_page_pdf(
            doc_path=doc_path,
            page_num=page_num,
            lang=lang,
            user_id=user_id,
            version=version,
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
            namespace=namespace,
            version=version
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
            namespace=namespace,
            version=version
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
