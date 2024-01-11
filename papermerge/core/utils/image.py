from pathlib import Path
from uuid import UUID

from pdf2image import convert_from_path

from papermerge.core import constants as const
from papermerge.core import pathlib as core_pathlib


def file_name_generator(size):
    yield str(size)


def generate_thumbnail(
    page_id: UUID,
    doc_ver_id: UUID,
    page_number: int,
    file_name: str,
    size: int = const.DEFAULT_THUMBNAIL_SIZE
):
    """
    Extracts jpg image of page `page_number` from PDF file associated with
    given `doc_ver_id`.

    `doc_ver_id` and `file_name` are required for getting the PDF
    file location.
    `page_id` and `size` are required for knowing where to save
    jpg file.
    """
    thb_path = core_pathlib.abs_thumbnail_path(str(page_id), size=size)
    pdf_path = core_pathlib.abs_docver_path(
        str(doc_ver_id),
        file_name
    )

    generate_preview(
        pdf_path=pdf_path,
        output_folder=thb_path.parent,
        page_number=page_number,
        size=size
    )


def generate_preview(
    pdf_path: Path,
    output_folder: Path,
    size: int = const.DEFAULT_THUMBNAIL_SIZE,
    page_number: int = 1,
):
    """Generate jpg thumbnail/preview images of PDF document"""
    kwargs = {
        'pdf_path': str(pdf_path),
        'output_folder': str(output_folder),
        'fmt': 'jpg',
        'first_page': page_number,
        'last_page': page_number,
        'single_file': True,
        'size': (size, None),
        'output_file': file_name_generator(size)
    }

    output_folder.mkdir(exist_ok=True, parents=True)

    # generates jpeg previews of PDF file using pdftoppm (poppler-utils)
    convert_from_path(**kwargs)
