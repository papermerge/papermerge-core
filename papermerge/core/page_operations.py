import io
from pathlib import Path
from typing import List

from pikepdf import Pdf

from papermerge.core.models import Page
from papermerge.core.schemas import DocumentVersion as PyDocVer
from papermerge.core.schemas.pages import PageAndRotOp
from papermerge.core.storage import get_storage_instance


def apply_pages_op(items: List[PageAndRotOp]) -> List[PyDocVer]:
    pages = Page.objects.filter(
        pk__in=[item.page.id for item in items]
    )
    old_version = pages.first().document_version

    doc = old_version.document
    new_version = doc.version_bump(
        page_count=len(items)
    )

    transform_pdf_pages(
        src=old_version.file_path,
        dst=new_version.file_path,
        items=items
    )

    return doc.versions.all()


def transform_pdf_pages(
    src: Path,
    dst: Path,
    items: List[PageAndRotOp]
):
    src_pdf = Pdf.open(src)

    dst_pdf = Pdf.new()

    for item in items:
        page = src_pdf.pages.p(item.page.number)
        if item.angle:
            # apply rotation (relative to the current angle)
            page.rotate(item.angle, relative=True)
        dst_pdf.pages.append(page)

    dst.parent.mkdir(parents=True, exist_ok=True)
    dst_pdf.save(dst)


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
