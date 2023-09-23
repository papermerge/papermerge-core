import io
import os
from pathlib import Path
from typing import List

from pikepdf import Pdf

from papermerge.core.models import Page
from papermerge.core.schemas import DocumentVersion as PyDocVer
from papermerge.core.schemas.pages import PageAndRotOp
from papermerge.core.storage import abs_path, get_storage_instance


def apply_pages_op(items: List[PageAndRotOp]):
    pages = Page.objects.filter(
        pk__in=[item.page.id for item in items]
    )
    old_version = pages.first().document_version

    doc = old_version.document
    new_version = doc.version_bump(
        page_count=len(items)
    )

    reorder_pdf_pages(
        old_version=old_version,
        new_version=new_version,
        items=items
    )


def reorder_pdf_pages(
    old_version: PyDocVer,
    new_version: PyDocVer,
    items: List[PageAndRotOp]
):
    src = Pdf.open(abs_path(old_version.document_path.url))

    dst = Pdf.new()

    for item in items:
        page = src.pages.p(item.page.number)
        dst.pages.append(page)

    dirname = os.path.dirname(
        abs_path(new_version.document_path.url)
    )
    os.makedirs(dirname, exist_ok=True)
    dst.save(abs_path(new_version.document_path.url))


def reuse_ocr_data(uuid_map) -> None:
    storage_instance = get_storage_instance()

    for src_uuid, dst_uuid in uuid_map.items():
        storage_instance.copy_page(
            src=Path("pages", src_uuid),
            dst=Path("pages", dst_uuid)
        )


def reuse_text_field(
    old_version: PyDocVer,
    new_version: PyDocVer,
    page_map: list
) -> None:
    streams = collect_text_streams(
        version=old_version,
        # list of old_version page numbers
        page_numbers=[item[1] for item in page_map]
    )

    # updates page.text fields and document_version.text field
    new_version.update_text_field(streams)


def collect_text_streams(
    version: PyDocVer,
    page_numbers: list[int]
) -> list[io.StringIO]:
    """
    Returns list of texts of given page numbers from specified document version

    Each page's text is wrapped as io.StringIO instance.
    """
    pages_map = {page.number: page for page in version.pages.all()}

    result = [
        io.StringIO(pages_map[number].text)
        for number in page_numbers
    ]

    return result
