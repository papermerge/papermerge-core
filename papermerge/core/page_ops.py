"""Page Operations"""
import io
import logging
import uuid
from pathlib import Path
from typing import List

from celery import current_app
from pikepdf import Pdf

from papermerge.core import constants as const
from papermerge.core.models import Document, Folder, Page
from papermerge.core.models.utils import OCR_STATUS_SUCCEEDED
from papermerge.core.pathlib import abs_page_path
from papermerge.core.schemas import Document as PyDocument
from papermerge.core.schemas import DocumentVersion as PyDocVer
from papermerge.core.schemas.pages import (ExtractStrategy, MoveStrategy,
                                           PageAndRotOp)
from papermerge.core.storage import get_storage_instance
from papermerge.core.utils.decorators import skip_in_tests

logger = logging.getLogger(__name__)


def apply_pages_op(items: List[PageAndRotOp]) -> List[PyDocVer]:
    pages = Page.objects.filter(
        pk__in=[item.page.id for item in items]
    )
    old_version = pages.first().document_version

    doc = old_version.document
    new_version = doc.version_bump(
        page_count=len(items)
    )

    copy_pdf_pages(
        src=old_version.file_path,
        dst=new_version.file_path,
        items=items
    )

    copy_text_field(
        src=old_version,
        dst=new_version,
        page_numbers=[p.number for p in pages]
    )

    notify_version_update(
        remove_ver_id=str(old_version.id),
        add_ver_id=str(new_version.id)
    )
    notify_generate_previews(str(doc.id))

    return doc.versions.all()


def copy_pdf_pages(
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


def copy_pdf(
    src: Path,
    dst: Path,
    page_numbers: list[int]
):
    """
    Copy pages from src to dst file

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


def reuse_ocr_data(
    source_ids: list[uuid.UUID],
    target_ids: list[uuid.UUID]
) -> list[uuid.UUID]:
    """Copies OCR data from source locations to target locations

    Location is path of the OCR data (abs_page_page(id)) for given page ID.
    Returns
    """
    storage_instance = get_storage_instance()
    not_copied_ids = []

    for src_uuid, dst_uuid in zip(source_ids, target_ids):
        if abs_page_path(src_uuid).is_dir():
            storage_instance.copy_page(
                src=abs_page_path(src_uuid),
                dst=abs_page_path(dst_uuid)
            )
        else:
            not_copied_ids.append(src_uuid)

    return not_copied_ids


def copy_text_field(
    src: PyDocVer,
    dst: PyDocVer,
    page_numbers: list[int]
) -> None:
    logger.debug(
        f"Reuse text field for page numbers={page_numbers}"
        f" src={src}"
        f" dst={dst}"
    )
    streams = collect_text_streams(
        version=src,
        # list of old_version page numbers
        page_numbers=page_numbers
    )
    # updates page.text fields and document_version.text field
    dst.update_text_field(streams)


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
) -> [PyDocument | None, PyDocument]:
    """
    Returns source and destination document.

    Returned source may be None - this is the case when all
    pages of the source document are moved out.
    """
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
) -> [PyDocument | None, PyDocument]:
    """Move pages from src to dst using mix strategy

    MIX strategy means that source pages on the target will be "mixed"
    with destination pages (placed one next to another).
    Newly inserted pages are inserted at the beginning of the
    document version.

    In case all pages from the source are moved, the source
    document is deleted and None is yielded as first
    value of the returned tuple.
    """
    [
        src_old_version,
        src_new_version,
        moved_pages_count
    ] = copy_without_pages(source_page_ids)

    moved_pages = Page.objects.filter(pk__in=source_page_ids)
    moved_page_ids = [page.id for page in moved_pages]

    dst_page = Page.objects.get(pk=target_page_id)
    dst_old_version = dst_page.document_version
    dst_old_doc = dst_old_version.document

    dst_new_version = dst_old_doc.version_bump(
        page_count=dst_old_version.pages.count() + moved_pages_count,
        short_description=f'{moved_pages_count} page(s) moved in'
    )

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
    if not_copied_ids := reuse_ocr_data(
        source_ids=src_keys_1 + src_keys_2,
        target_ids=dst_values_1 + dst_values_2
    ):
        logger.info(
            f"Pages with IDs {not_copied_ids} do not have OCR data"
        )

    if src_old_version.pages.count() == moved_pages_count:
        # !!!this means new source (src_new_version) has zero pages!!!
        # Delete entire source and return None as first tuple element
        src_old_version.document.delete()
        _dst_doc = dst_new_version.document
        notify_generate_previews(str(_dst_doc.id))
        return [None, _dst_doc]

    notify_version_update(
        add_ver_id=str(dst_new_version.id),
        remove_ver_id=str(dst_old_version.id),
    )
    _src_doc = src_new_version.document
    _dst_doc = dst_new_version.document
    notify_generate_previews([
        str(_src_doc.id),
        str(_dst_doc.id)
    ])

    return [_src_doc, _dst_doc]


def move_pages_replace(
    source_page_ids: List[uuid.UUID],
    target_page_id: uuid.UUID
) -> [PyDocument | None, PyDocument]:
    """Move pages from src to dst using replace strategy

    REPLACE strategy means that source pages on the target will replace
    previous pages on the destination.

    In case all pages from the source are moved, the source
    document is deleted.
    """
    [
        src_old_version,
        src_new_version,
        moved_pages_count
    ] = copy_without_pages(source_page_ids)

    moved_pages = Page.objects.filter(pk__in=source_page_ids)
    moved_page_ids = [page.id for page in moved_pages]

    dst_page = Page.objects.get(pk=target_page_id)
    dst_old_version = dst_page.document_version
    dst_old_doc = dst_old_version.document

    dst_new_version = dst_old_doc.version_bump(
        page_count=moved_pages_count,  # !!! Important
        short_description=f'{moved_pages_count} page(s) replaced'
    )

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

    reuse_ocr_data(src_keys, dst_values)

    if src_old_version.pages.count() == moved_pages_count:
        # !!!this means new source (src_new_version) has zero pages!!!
        # Delete entire source and return None as first tuple element
        src_old_version.document.delete()
        _dst_doc = dst_new_version.document
        notify_generate_previews(str(_dst_doc.id))
        return [None, _dst_doc]

    notify_version_update(
        add_ver_id=str(dst_new_version.id),
        remove_ver_id=str(dst_old_version.id)
    )
    _src_doc = src_new_version.document
    _dst_doc = dst_new_version.document
    notify_generate_previews([
        str(_src_doc.id),
        str(_dst_doc.id)
    ])
    return [_src_doc, _dst_doc]


def extract_pages(
    source_page_ids: List[uuid.UUID],
    target_folder_id: uuid.UUID,
    strategy: ExtractStrategy,
    title_format: str
) -> [Document | None, List[Document]]:
    """

    Returns a tuple where first element
    is source document and second element is the list
    of newly created documents
    """
    [
        old_doc_ver,
        new_doc_ver,
        moved_pages_count
    ] = copy_without_pages(source_page_ids)

    if strategy == ExtractStrategy.ONE_PAGE_PER_DOC:
        new_docs = extract_to_single_paged_docs(
            source_page_ids=source_page_ids,
            target_folder_id=target_folder_id,
            title_format=title_format
        )
    else:
        # all pages in a single doc
        new_docs = extract_to_multi_paged_doc(
            source_page_ids=source_page_ids,
            target_folder_id=target_folder_id,
            title_format=title_format
        )

    source_doc = new_doc_ver.document
    if not isinstance(new_docs, list):
        target_docs = [new_docs]
    else:
        target_docs = new_docs

    for doc in target_docs:
        logger.debug(
            f"Notifying index to add doc.title={doc.title} doc.id={doc.id}"
        )
        logger.debug(f"Doc last version={doc.versions.last()}")

    notify_add_docs([str(doc.id) for doc in target_docs])
    notify_generate_previews(
        list([str(doc.id) for doc in target_docs])
    )

    if old_doc_ver.pages.count() == moved_pages_count:
        # all source pages were extracted, document should
        # be deleted as its last version does not contain
        # any page
        old_doc_ver.document.delete()
        return [None, target_docs]

    notify_generate_previews(str(source_doc.id))
    return [source_doc, target_docs]


def extract_to_single_paged_docs(
    source_page_ids: List[uuid.UUID],
    target_folder_id: uuid.UUID,
    title_format: str
) -> List[Document]:
    """Extracts given pages into separate documents

    Each source page will end up in a separate document
    located in target folder.
    """
    pages = Page.objects.filter(pk__in=source_page_ids)
    dst_folder = Folder.objects.get(pk=target_folder_id)
    result = []

    for page in pages:
        title = f'{title_format}-{uuid.uuid4()}.pdf'

        doc = Document.objects.create_document(
            title=title,
            lang=page.lang,
            user_id=dst_folder.user_id,
            parent=dst_folder,
            ocr_status=OCR_STATUS_SUCCEEDED
        )
        result.append(doc)
        # create new document version with one page
        doc_version = doc.version_bump_from_pages(pages=[page])

        reuse_ocr_data(
            source_ids=[page.id],
            target_ids=[doc_version.pages.first().id]
        )

        copy_text_field(
            src=pages.first().document_version,
            dst=doc_version,
            page_numbers=[page.number]
        )

    return result


def extract_to_multi_paged_doc(
    source_page_ids: List[uuid.UUID],
    target_folder_id: uuid.UUID,
    title_format: str
) -> Document:
    """Extracts given pages into separate documents

    All source pages will end up in a single document
    located in target folder.
    """
    title = f'{title_format}-{uuid.uuid4()}.pdf'

    pages = Page.objects.filter(pk__in=source_page_ids)
    first_page = pages[0]
    dst_folder = Folder.objects.get(pk=target_folder_id)

    new_doc = Document.objects.create_document(
        title=title,
        lang=first_page.lang,
        user_id=dst_folder.user_id,
        parent=dst_folder,
        ocr_status=OCR_STATUS_SUCCEEDED
    )

    dst_version = new_doc.version_bump_from_pages(pages=pages)

    reuse_ocr_data(
        source_ids=[page.id for page in pages.order_by('number')],
        target_ids=[page.id for page in dst_version.pages.order_by('number')]
    )

    copy_text_field(
        src=pages.first().document_version,
        dst=dst_version,
        page_numbers=[p.number for p in pages]
    )

    return new_doc


def copy_without_pages(
    page_ids: List[uuid.UUID]
) -> [PyDocVer, PyDocVer, int]:
    """Copy all pages  WHICH ARE NOT in `page_ids` list from src to dst

    All pages are assumed to be from same source document version.
    Source is the document version of the first page.
    Destination will be created as new document version.
    Destination will have all source pages WHICH ARE NOT in the `page_ids` list.

    The OCR data/page folder reused.
    Also sends INDEX UPDATE notification.
    """
    moved_pages = Page.objects.filter(pk__in=page_ids)
    moved_page_ids = [page.id for page in moved_pages]
    src_first_page = moved_pages.first()
    src_old_version = src_first_page.document_version
    src_old_doc = src_old_version.document
    moved_pages_count = moved_pages.count()

    src_new_version = src_old_doc.version_bump(
        page_count=src_old_version.pages.count() - moved_pages_count,
        short_description=f'{moved_pages_count} page(s) moved out'
    )

    copy_pdf(
        src=src_old_version.file_path,
        dst=src_new_version.file_path,
        page_numbers=[page.number for page in moved_pages]
    )

    src_keys = [  # IDs of the pages which were not removed
        page.id
        for page in src_old_version.pages.order_by('number')
        if not (page.id in moved_page_ids)  # Notice the negation
    ]

    dst_values = [
        page.id  # IDs of the pages in new version of the source
        for page in src_new_version.pages.order_by('number')
    ]

    if not_copied_ids := reuse_ocr_data(src_keys, dst_values):
        logger.info(
            f"Pages with IDs {not_copied_ids} do not have OCR data"
        )

    copy_text_field(
        src=src_old_version,
        dst=src_new_version,
        page_numbers=[
            p.number
            for p in src_old_version.pages.all()
            if not (p.id in moved_page_ids)  # Notice the negation
        ]
    )

    notify_version_update(
        remove_ver_id=str(src_old_version.id),
        add_ver_id=str(src_new_version.id)
    )

    return [
        src_old_version,  # orig. ver where pages were copied from
        src_new_version,  # ver where pages were copied to
        moved_pages_count  # how many pages moved
    ]


@skip_in_tests
def notify_version_update(
    add_ver_id: str,
    remove_ver_id: str
):
    # Send tasks to the index to remove/add pages
    current_app.send_task(const.INDEX_UPDATE, (add_ver_id, remove_ver_id))

    current_app.send_task(
        const.S3_WORKER_ADD_DOC_VER,
        kwargs={'doc_ver_ids': [add_ver_id]},
        route_name='s3',
    )
    current_app.send_task(
        const.S3_WORKER_REMOVE_DOC_VER,
        kwargs={'doc_ver_ids': [remove_ver_id]},
        route_name='s3',
    )


@skip_in_tests
def notify_add_docs(add_doc_ids: List[str]):
    # send task to index
    logger.debug(f"Sending task {const.INDEX_ADD_DOCS} with {add_doc_ids}")
    current_app.send_task(const.INDEX_ADD_DOCS, (add_doc_ids, ))

    ids = []
    for doc in Document.objects.filter(id__in=add_doc_ids):
        for doc_ver in doc.versions.all():
            ids.append(str(doc_ver.id))

    current_app.send_task(
        const.S3_WORKER_ADD_DOC_VER,
        kwargs={'doc_ver_ids': ids},
        route_name='s3',
    )


@skip_in_tests
def notify_generate_previews(doc_id: list[str] | str):
    if isinstance(doc_id, str):
        current_app.send_task(
            const.S3_WORKER_GENERATE_PREVIEW,
            kwargs={'doc_id': doc_id},
            route_name='s3preview',
        )
        return
    elif isinstance(doc_id, list):
        for item in doc_id:
            current_app.send_task(
                const.S3_WORKER_GENERATE_PREVIEW,
                kwargs={'doc_id': item},
                route_name='s3preview',
            )
    else:
        raise ValueError(
            f"Unexpected type of doc_id: {type(doc_id)}"
        )
