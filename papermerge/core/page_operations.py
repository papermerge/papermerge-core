import io
import uuid
from pathlib import Path
from typing import List

from pikepdf import Pdf

from papermerge.core.models import Page
from papermerge.core.pathlib import abs_page_path
from papermerge.core.schemas import Document as PyDocument
from papermerge.core.schemas import DocumentVersion as PyDocVer
from papermerge.core.schemas.pages import MoveStrategy, PageAndRotOp
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


def remove_pdf_pages(
    src: Path,
    dst: Path,
    page_numbers: list[int]
):
    """
    Removes pages from given PDF file

    Notice that page numbering starts with 1 i.e. page_numbers=[1, 2] -
    will remove first and second pages.
    """
    if len(page_numbers) < 1:
        raise ValueError("Empty page_numbers")

    pdf = Pdf.open(src)

    if len(pdf.pages) < len(page_numbers):
        raise ValueError("Too many values in page_numbers")

    _deleted_count = 0
    for page_number in page_numbers:
        pdf.pages.remove(p=page_number - _deleted_count)
        _deleted_count += 1

    dst.parent.mkdir(parents=True, exist_ok=True)
    pdf.save(dst)


def insert_pdf_pages(
    src_old: Path,
    dst_old: Path | None,
    dst_new: Path,
    src_page_numbers: list[int],
    dst_position: int = 0
) -> None:
    """Inserts pages from source to destination at given position

    In case both `dst_old` and `dst_new` parameters
    are non-empty - `insert_pdf_pages` will take
    `src_page_numbers` from `src_old` and
    insert them at `dst_position` of `dst_old` and will
    save result in `dst_new`.

    In case `dst_old` is None - `insert_pdf_pages` will
    take `src_page_numbers` from `src_old` and insert
    at position 0 of the newly created pdf. Newly created pdf will be saved
    at `dst_new`.

    Remarks:
    `dst_position` starts with 0.
    In `src_page_numbers` page numbering starts with 1 i.e.
    when `src_page_numbers=[1, 2]` means insert first and second pages from
    source.
    """
    src_old_pdf = Pdf.open(src_old)

    if dst_old is None:
        # "replace" strategy
        dst_old_pdf = Pdf.new()
        dst_position = 0
    else:
        dst_old_pdf = Pdf.open(dst_old)

    _inserted_count = 0
    for page_number in src_page_numbers:
        pdf_page = src_old_pdf.pages.p(page_number)
        dst_old_pdf.pages.insert(dst_position + _inserted_count, pdf_page)
        _inserted_count += 1

    dst_new.parent.mkdir(parents=True, exist_ok=True)
    dst_old_pdf.save(dst_new)


def reuse_ocr_data(uuid_map) -> None:
    storage_instance = get_storage_instance()

    for src_uuid, dst_uuid in uuid_map.items():
        storage_instance.copy_page(
            src=abs_page_path(src_uuid),
            dst=abs_page_path(dst_uuid)
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


def move_pages(
    source_page_ids: List[uuid.UUID],
    target_page_id: uuid.UUID,
    move_strategy: MoveStrategy
) -> [PyDocument, PyDocument]:
    if move_strategy == MoveStrategy.REPLACE:
        return move_pages_replace(
            source_page_ids=source_page_ids,
            target_page_id=target_page_id
        )

    return move_pages_mix(
        source_page_ids=source_page_ids,
        target_page_id=target_page_id
    )


def move_pages_mix(
    source_page_ids: List[uuid.UUID],
    target_page_id: uuid.UUID
) -> [PyDocument, PyDocument]:
    """Move pages from src to dst using mix strategy

    MIX strategy means that source pages on the target will be "mixed"
    with destination pages (placed one next to another).
    Newly inserted pages are inserted at the beginning of the
    document version.

    In case all pages from the source are moved, the source
    document is deleted.
    """
    moved_pages = Page.objects.filter(pk__in=source_page_ids)
    moved_page_ids = [page.id for page in moved_pages]
    src_first_page = moved_pages.first()
    dst_page = Page.objects.get(pk=target_page_id)
    src_old_version = src_first_page.document_version
    src_old_doc = src_old_version.document
    dst_old_version = dst_page.document_version
    dst_old_doc = dst_old_version.document
    pages_count = moved_pages.count()

    src_new_version = src_old_doc.version_bump(
        page_count=src_old_version.pages.count() - pages_count,
        short_description=f'{pages_count} page(s) moved out'
    )
    dst_new_version = dst_old_doc.version_bump(
        page_count=dst_old_version.pages.count() + pages_count,
        short_description=f'{pages_count} page(s) moved in'
    )

    remove_pdf_pages(
        src=src_old_version.file_path,
        dst=src_new_version.file_path,
        page_numbers=[page.number for page in moved_pages]
    )
    src_keys = [  # IDs of the pages which were not removed
        page.id
        for page in src_old_version.pages.order_by('number')
        if not (page.id in moved_page_ids)
    ]

    dst_values = [
        page.id  # IDs of the pages in new version of the source
        for page in src_new_version.pages.order_by('number')
    ]
    reuse_map = dict(zip(src_keys, dst_values))
    reuse_ocr_data(reuse_map)

    insert_pdf_pages(
        src_old=src_old_version.file_path,
        dst_old=dst_old_version.file_path,
        dst_new=dst_new_version.file_path,
        src_page_numbers=[p.number for p in moved_pages.order_by('number')],
        dst_position=0
    )

    src_keys_1 = moved_page_ids
    dst_values_1 = [
        page.id  # IDs of the pages in new version of the source
        for page in dst_new_version.pages.order_by('number')
        if page.number <= len(moved_page_ids)
    ]
    src_keys_2 = [
        page.id
        for page in dst_old_version.pages.order_by('number')
    ]
    dst_values_2 = [
        page.id  # IDs of the pages in new version of the source
        for page in dst_new_version.pages.order_by('number')
        if page.number > len(moved_page_ids)
    ]
    reuse_map = dict(
        zip(src_keys_1 + src_keys_2, dst_values_1 + dst_values_2)
    )
    reuse_ocr_data(reuse_map)

    return [src_new_version.document, dst_new_version.document]


def move_pages_replace(
    source_page_ids: List[uuid.UUID],
    target_page_id: uuid.UUID
) -> [PyDocument, PyDocument]:
    """Move pages from src to dst using replace strategy

    REPLACE strategy means that source pages on the target will replace
    previous pages on the destination.

    In case all pages from the source are moved, the source
    document is deleted.
    """
    moved_pages = Page.objects.filter(pk__in=source_page_ids)
    moved_page_ids = [page.id for page in moved_pages]
    src_first_page = moved_pages.first()
    dst_page = Page.objects.get(pk=target_page_id)
    src_old_version = src_first_page.document_version
    src_old_doc = src_old_version.document
    dst_old_version = dst_page.document_version
    dst_old_doc = dst_old_version.document
    pages_count = moved_pages.count()

    src_new_version = src_old_doc.version_bump(
        page_count=src_old_version.pages.count() - pages_count,
        short_description=f'{pages_count} page(s) moved out'
    )
    dst_new_version = dst_old_doc.version_bump(
        page_count=pages_count,  # !!! Important
        short_description=f'{pages_count} page(s) replaced'
    )

    remove_pdf_pages(
        src=src_old_version.file_path,
        dst=src_new_version.file_path,
        page_numbers=[page.number for page in moved_pages]
    )
    src_keys = [  # IDs of the pages which were not removed
        page.id
        for page in src_old_version.pages.order_by('number')
        if not (page.id in moved_page_ids)
    ]

    dst_values = [
        page.id  # IDs of the pages in new version of the source
        for page in src_new_version.pages.order_by('number')
    ]
    reuse_map = dict(zip(src_keys, dst_values))
    reuse_ocr_data(reuse_map)

    insert_pdf_pages(
        src_old=src_old_version.file_path,
        dst_old=None,  # !!! Important
        dst_new=dst_new_version.file_path,
        src_page_numbers=[p.number for p in moved_pages.order_by('number')],
        dst_position=0
    )

    src_keys = moved_page_ids
    dst_values = [
        page.id
        for page in dst_new_version.pages.order_by('number')
    ]
    reuse_map = dict(zip(src_keys, dst_values))
    reuse_ocr_data(reuse_map)

    return [src_new_version.document, dst_new_version.document]
