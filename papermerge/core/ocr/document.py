import logging
from pathlib import Path
from typing import List
from uuid import UUID

import ocrmypdf
from django.conf import settings

from papermerge.core.constants import OCR, PAGES
from papermerge.core.lib import mime
from papermerge.core.models import DocumentVersion
from papermerge.core.pathlib import abs_docver_path
from papermerge.core.storage import abs_path

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
    document_version: DocumentVersion,
    target_docver_uuid: UUID,
    target_page_uuids: List[UUID],
    lang: str,
    preview_width: int,
):
    sidecar_dir = Path(
        settings.MEDIA_ROOT,
        OCR,
        PAGES
    )

    output_dir = abs_docver_path(
        target_docver_uuid,
        document_version.file_name
    )

    if not output_dir.parent.exists():
        output_dir.parent.mkdir(parents=True, exist_ok=True)

    ocrmypdf.ocr(
        document_version.file_path,
        output_dir,
        lang=lang,
        plugins=["ocrmypdf_papermerge.plugin"],
        progress_bar=False,
        output_type='pdf',
        pdf_renderer='hocr',
        use_threads=True,
        force_ocr=True,
        keep_temporary_files=False,
        sidecar_dir=sidecar_dir,
        uuids=','.join(str(item) for item in target_page_uuids),
        sidecar_format='svg',
        preview_width=preview_width,
        deskew=True
    )


def ocr_document(
    document_version: DocumentVersion,
    target_docver_uuid: UUID,
    target_page_uuids: List[UUID],
    lang: str
):
    lang = lang.lower()

    mime_type = mime.Mime(
        abs_path(document_version.file_path)
    )

    if mime_type.is_pdf() or mime_type.is_image():
        _ocr_document(
            document_version=document_version,
            target_docver_uuid=target_docver_uuid,
            target_page_uuids=target_page_uuids,
            lang=lang,
            preview_width=300
        )
    elif mime_type.is_tiff():
        """
        # TODO:
        #new_filename = convert_tiff2pdf(
        #    doc_url=abs_path(document_version.file_path)
        #)
        # now .pdf
        #orig_file_name = doc_path.file_name
        #doc_path.file_name = new_filename
        # and continue as usual
        #_ocr_document(
        #    document_version=document_version,
        #    lang=lang,
        #)
        """
    else:
        raise ValueError(
            f"Unsupported format for document: {document_version.file_path}"
        )

    return True
