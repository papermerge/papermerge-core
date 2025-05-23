import logging
from pathlib import Path
from uuid import UUID

from pdf2image import convert_from_path

from papermerge.core import constants as const
from papermerge.core import pathlib as core_pathlib
from papermerge.core.types import ImagePreviewSize
from papermerge.core import config

settings = config.get_settings()

PREVIEW_IMAGE_MAP = {
    # size name        : size in pixels
    ImagePreviewSize.sm: settings.papermerge__preview__page_size_sm,
    ImagePreviewSize.md: settings.papermerge__preview__page_size_md,
    ImagePreviewSize.lg: settings.papermerge__preview__page_size_lg,
    ImagePreviewSize.xl: settings.papermerge__preview__page_size_xl,
}

logger = logging.getLogger(__name__)


def file_name_generator(size):
    yield str(size)


def gen_doc_thumbnail(
    page_id: UUID,
    doc_ver_id: UUID,
    page_number: int,
    file_name: str,
    size: int = const.DEFAULT_THUMBNAIL_SIZE,
):
    """
    Extracts jpg image of page `page_number` from PDF file associated with
    given `doc_ver_id`.

    `doc_ver_id` and `file_name` are required for getting the PDF
    file location.
    `page_id` and `size` are required for knowing where to save
    jpg file.
    """
    thb_path = core_pathlib.abs_thumbnail_path(str(page_id))
    pdf_path = core_pathlib.abs_docver_path(str(doc_ver_id), file_name)

    generate_preview(
        pdf_path=pdf_path,
        output_folder=thb_path.parent,
        page_number=page_number,
        size_px=settings.papermerge__preview__page_size_sm,
        size_name=ImagePreviewSize.sm.value,
    )


def gen_page_preview(
    doc_ver_id, file_name: str, page_id: UUID, page_number: int, size: ImagePreviewSize
):
    logger.info(f"Generating preview for {page_id=} {page_number=} {size=}")
    pdf_path = core_pathlib.abs_docver_path(str(doc_ver_id), str(file_name))
    abs_image_path = core_pathlib.rel2abs(
        core_pathlib.page_preview_jpg_path(page_id, size=size)
    )
    generate_preview(
        pdf_path=pdf_path,
        output_folder=abs_image_path.parent,
        size_px=PREVIEW_IMAGE_MAP[size],
        size_name=size.value,
        page_number=page_number,
    )

    return core_pathlib.page_preview_jpg_path(page_id, size=size)


def generate_preview(
    pdf_path: Path,
    output_folder: Path,
    size_px: int,
    size_name: str,
    page_number: int = 1,
):
    """Generate jpg thumbnail/preview images of PDF document"""
    kwargs = {
        "pdf_path": str(pdf_path),
        "output_folder": str(output_folder),
        "fmt": "jpg",
        "first_page": page_number,
        "last_page": page_number,
        "single_file": True,
        "size": (size_px, None),
        "output_file": file_name_generator(size_name),
    }

    output_folder.mkdir(exist_ok=True, parents=True)

    # generates jpeg previews of PDF file using pdftoppm (poppler-utils)
    convert_from_path(**kwargs)
