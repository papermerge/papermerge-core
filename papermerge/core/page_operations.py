import os
from typing import List

from pikepdf import Pdf

from papermerge.core.models import Page
from papermerge.core.schemas import DocumentVersion as PyDocVer
from papermerge.core.schemas.pages import PageAndRotOp
from papermerge.core.storage import abs_path


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
        pages_data=items,
        page_count=len(items)
    )


def reorder_pdf_pages(
    old_version: PyDocVer,
    new_version: PyDocVer,
    items: List[PageAndRotOp],
    page_count: int
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
