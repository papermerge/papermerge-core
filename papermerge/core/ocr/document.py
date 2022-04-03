import os
import logging

import ocrmypdf

from papermerge.core.storage import abs_path
from papermerge.core.lib import mime
from papermerge.core.lib.tiff import convert_tiff2pdf
from papermerge.core.lib.path import (
    DocumentPath,
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
    input_doc_path: DocumentPath,
    target_doc_path,
    lang,
    preview_width,
):

    # file_name = kwargs.pop('file_name', None)

    # if not file_name:
    #    input_file_name = input_doc_path.file_name

    sidecars_dir = abs_path(target_doc_path.dirname_sidecars())

    input_document = abs_path(input_doc_path.path)

    output_document = abs_path(target_doc_path.path)

    output_dir = os.path.dirname(output_document)

    if not os.path.exists(output_dir):
        os.makedirs(
            output_dir,
            exist_ok=True
        )

    ocrmypdf.ocr(
        input_document,
        output_document,
        lang=lang,
        plugins=["ocrmypdf_papermerge.plugin"],
        progress_bar=False,
        output_type='pdf',
        pdf_renderer='hocr',
        use_threads=True,
        force_ocr=True,
        keep_temporary_files=False,
        sidecar_dir=sidecars_dir,
        sidecar_format='svg',
        preview_width=preview_width
    )


def ocr_document(
    user_id,
    document_id,
    file_name,
    lang,
    version,
    target_version,
    namespace='',
):
    lang = lang.lower()
    doc_path = DocumentPath(
        user_id=user_id,
        document_id=document_id,
        file_name=file_name,
        version=version
    )
    target_doc_path = DocumentPath.copy_from(
        doc_path,
        version=target_version
    )

    mime_type = mime.Mime(
        abs_path(doc_path.url)
    )

    if mime_type.is_pdf() or mime_type.is_image():
        _ocr_document(
            input_doc_path=doc_path,
            target_doc_path=target_doc_path,
            lang=lang,
            preview_width=300
        )
    elif mime_type.is_tiff():
        new_filename = convert_tiff2pdf(
            doc_url=abs_path(doc_path.url)
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

    return True
