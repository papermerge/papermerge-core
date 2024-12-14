"""Page Management"""

import io
import logging
import uuid
from pathlib import Path
from typing import List


from pikepdf import Pdf
from sqlalchemy import select, delete

from papermerge.core import tasks
from papermerge.core import constants as const
from papermerge.core.pathlib import abs_page_path
from papermerge.core.storage import get_storage_instance
from papermerge.core.utils.decorators import if_redis_present
from papermerge.core.db import Session
from papermerge.core import orm, schema, types
from papermerge.core.features.document.db import api as doc_dbapi


logger = logging.getLogger(__name__)


def copy_text_field(
    db_session: Session,
    src: schema.DocumentVersion,
    dst: schema.DocumentVersion,
    page_numbers: list[int],
) -> None:
    streams = collect_text_streams(
        version=src,
        # list of old_version page numbers
        page_numbers=page_numbers,
    )
    # updates page.text fields and document_version.text field
    doc_dbapi.update_text_field(db_session, dst.id, streams)


def collect_text_streams(
    version: schema.DocumentVersion, page_numbers: list[int]
) -> list[io.StringIO]:
    """
    Returns list of texts of given page numbers from specified document version

    Each page's text is wrapped as io.StringIO instance.
    """
    pages_map = {page.number: page for page in version.pages}

    result = [io.StringIO(pages_map[number].text) for number in page_numbers]

    return result


def apply_pages_op(
    db_session, items: List[schema.PageAndRotOp], user_id: uuid.UUID
) -> List[schema.Document]:
    """Apply operations (operation = transformation) on the document

    It is assumed that all pages are part of the same document version.
    Apply operation means following:
        - create new document version
        - copy to new document version only selected pages (i.e. the pages
        identified by `List[schema.PageAndRotOp]`)
        - The input list (the `items: List[schema.PageAndRotOp]`) may also
        have angle != 0 - in such case page is also rotated

    Note that "copy to new document version" has to parts:
        - recreate the 'page' models (and copy text from old one to new ones)
        - recreate pdf file (and copy its pages from old one to new ones)
    """
    pages = db_session.execute(
        select(orm.Page).where(orm.Page.id.in_(item.page.id for item in items))
    ).scalars()

    pages = pages.all()

    old_version = db_session.execute(
        select(orm.DocumentVersion)
        .where(orm.DocumentVersion.id == pages[0].document_version_id)
        .limit(1)
    ).scalar()

    doc = old_version.document
    new_version = doc_dbapi.version_bump(
        db_session, doc_id=doc.id, user_id=user_id, page_count=len(items)
    )

    copy_pdf_pages(src=old_version.file_path, dst=new_version.file_path, items=items)

    copy_text_field(
        db_session,
        src=old_version,
        dst=new_version,
        page_numbers=[p.number for p in pages],
    )

    notify_version_update(
        remove_ver_id=str(old_version.id), add_ver_id=str(new_version.id)
    )
    notify_generate_previews(str(doc.id))

    return doc


def copy_pdf_pages(src: Path, dst: Path, items: List[schema.PageAndRotOp]):
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


def copy_pdf(src: Path, dst: Path, page_numbers: list[int]):
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
    for page_number in sorted(page_numbers):
        remove = page_number - _deleted_count
        pdf.pages.remove(p=remove)
        _deleted_count += 1

    dst.parent.mkdir(parents=True, exist_ok=True)
    pdf.save(dst)


def insert_pdf_pages(
    src_old: Path,
    dst_old: Path | None,
    dst_new: Path,
    src_page_numbers: list[int],
    dst_position: int = 0,
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
    source_ids: list[uuid.UUID], target_ids: list[uuid.UUID]
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
                src=abs_page_path(src_uuid), dst=abs_page_path(dst_uuid)
            )
        else:
            not_copied_ids.append(src_uuid)

    return not_copied_ids


def move_pages(
    db_session: Session,
    source_page_ids: List[uuid.UUID],
    target_page_id: uuid.UUID,
    move_strategy: schema.MoveStrategy,
    user_id: uuid.UUID,
) -> [schema.Document | None, schema.Document]:
    """
    Returns source and destination document.

    Returned source may be None - this is the case when all
    pages of the source document are moved out.
    """
    if move_strategy == schema.MoveStrategy.REPLACE:
        return move_pages_replace(
            db_session,
            source_page_ids=source_page_ids,
            target_page_id=target_page_id,
            user_id=user_id,
        )

    return move_pages_mix(
        db_session,
        source_page_ids=source_page_ids,
        target_page_id=target_page_id,
        user_id=user_id,
    )


def move_pages_mix(
    db_session,
    *,
    source_page_ids: List[uuid.UUID],
    target_page_id: uuid.UUID,
    user_id: uuid.UUID,
) -> [schema.Document | None, schema.Document]:
    """Move pages from src to dst using mix strategy

    MIX strategy means that source pages on the target will be "mixed"
    with destination pages (placed one next to another).
    Newly inserted pages are inserted at the beginning of the
    document version.

    In case all pages from the source are moved, the source
    document is deleted and None is yielded as first
    value of the returned tuple.
    """
    [src_old_version, src_new_version, moved_pages_count] = copy_without_pages(
        db_session, source_page_ids, user_id=user_id
    )
    moved_pages = db_session.execute(
        select(orm.Page)
        .where(orm.Page.id.in_(source_page_ids))
        .order_by(orm.Page.number)
    ).scalars()
    moved_pages = moved_pages.all()
    moved_page_ids = [page.id for page in moved_pages]

    dst_page = db_session.execute(
        select(orm.Page).where(orm.Page.id == target_page_id)
    ).scalar()

    dst_old_version = db_session.query(orm.DocumentVersion).where(
        orm.DocumentVersion.id == dst_page.document_version_id
    )
    dst_old_version = dst_old_version.one()

    dst_old_doc = dst_old_version.document

    dst_new_version = doc_dbapi.version_bump(
        db_session,
        doc_id=dst_old_doc.id,
        user_id=user_id,
        page_count=len(dst_old_version.pages) + moved_pages_count,
        short_description=f"{moved_pages_count} page(s) moved in",
    )

    insert_pdf_pages(
        src_old=src_old_version.file_path,
        dst_old=dst_old_version.file_path,
        dst_new=dst_new_version.file_path,
        src_page_numbers=[p.number for p in moved_pages],
        dst_position=dst_page.number,
    )
    src_keys_1 = moved_page_ids
    dst_values_1 = [
        page.id  # IDs of the pages in new version of the source
        for page in sorted(dst_new_version.pages, key=lambda x: x.number)
        if page.number <= len(moved_page_ids)
    ]
    src_keys_2 = [
        page.id for page in sorted(dst_old_version.pages, key=lambda x: x.number)
    ]
    dst_values_2 = [
        page.id  # IDs of the pages in new version of the source
        for page in sorted(dst_new_version.pages, key=lambda x: x.number)
        if page.number > len(moved_page_ids)
    ]
    if not_copied_ids := reuse_ocr_data(
        source_ids=src_keys_1 + src_keys_2, target_ids=dst_values_1 + dst_values_2
    ):
        logger.info(f"Pages with IDs {not_copied_ids} do not have OCR data")

    if len(src_old_version.pages) == moved_pages_count:
        # !!!this means new source (src_new_version) has zero pages!!!
        # Delete entire source and return None as first tuple element
        _dst_doc = dst_new_version.document

        db_session.execute(
            delete(orm.Document).where(orm.Document.id == src_old_version.document.id)
        )

        notify_generate_previews(str(_dst_doc.id))
        return [None, _dst_doc]

    notify_version_update(
        add_ver_id=str(dst_new_version.id),
        remove_ver_id=str(dst_old_version.id),
    )
    _src_doc = src_new_version.document
    _dst_doc = dst_new_version.document
    notify_generate_previews([str(_src_doc.id), str(_dst_doc.id)])

    return [_src_doc, _dst_doc]


def move_pages_replace(
    db_session,
    *,
    source_page_ids: List[uuid.UUID],
    target_page_id: uuid.UUID,
    user_id: uuid.UUID,
) -> [schema.Document | None, schema.Document]:
    """Move pages from src to dst using replace strategy

    REPLACE strategy means that source pages on the target will replace
    previous pages on the destination.

    In case all pages from the source are moved, the source
    document is deleted.
    """
    [src_old_version, src_new_version, moved_pages_count] = copy_without_pages(
        db_session, source_page_ids, user_id=user_id
    )
    moved_pages = db_session.execute(
        select(orm.Page)
        .where(orm.Page.id.in_(source_page_ids))
        .order_by(orm.Page.number)
    ).scalars()
    moved_pages = moved_pages.all()
    moved_page_ids = [page.id for page in moved_pages]

    dst_page = db_session.execute(
        select(orm.Page).where(orm.Page.id == target_page_id)
    ).scalar()
    dst_old_version = dst_page.document_version
    dst_old_doc = dst_old_version.document

    dst_new_version = doc_dbapi.version_bump(
        db_session,
        doc_id=dst_old_doc.id,
        page_count=moved_pages_count,  # !!! Important
        short_description=f"{moved_pages_count} page(s) replaced",
        user_id=user_id,
    )

    insert_pdf_pages(
        src_old=src_old_version.file_path,
        dst_old=None,  # !!! Important
        dst_new=dst_new_version.file_path,
        src_page_numbers=[
            p.number for p in sorted(moved_pages, key=lambda x: x.number)
        ],
        dst_position=0,
    )

    src_keys = moved_page_ids
    dst_values = [
        page.id for page in sorted(dst_new_version.pages, key=lambda x: x.number)
    ]

    reuse_ocr_data(src_keys, dst_values)

    if len(src_old_version.pages) == moved_pages_count:
        # !!!this means new source (src_new_version) has zero pages!!!
        # Delete entire source and return None as first tuple element
        db_session.execute(
            delete(orm.Document).where(orm.Document.id == src_old_version.document.id)
        )
        _dst_doc = dst_new_version.document
        notify_generate_previews(str(_dst_doc.id))
        return [None, _dst_doc]

    notify_version_update(
        add_ver_id=str(dst_new_version.id), remove_ver_id=str(dst_old_version.id)
    )
    _src_doc = src_new_version.document
    _dst_doc = dst_new_version.document
    notify_generate_previews([str(_src_doc.id), str(_dst_doc.id)])
    return [_src_doc, _dst_doc]


def extract_pages(
    db_session,
    source_page_ids: List[uuid.UUID],
    target_folder_id: uuid.UUID,
    user_id: uuid.UUID,
    strategy: schema.ExtractStrategy,
    title_format: str,
) -> [schema.Document | None, List[schema.Document]]:
    """
    Returns a tuple where first element
    is source document and second element is the list
    of newly created documents
    """
    # source document's source will bumped
    # source document's new version = old version minus extracted pages
    [old_doc_ver, new_doc_ver, moved_pages_count] = copy_without_pages(
        db_session, source_page_ids, user_id=user_id
    )

    if strategy == schema.ExtractStrategy.ONE_PAGE_PER_DOC:
        new_docs = extract_to_single_paged_docs(
            db_session,
            source_page_ids=source_page_ids,
            target_folder_id=target_folder_id,
            title_format=title_format,
            user_id=user_id,
        )
    else:
        # all pages in a single doc
        new_docs = extract_to_multi_paged_doc(
            db_session,
            source_page_ids=source_page_ids,
            target_folder_id=target_folder_id,
            title_format=title_format,
            user_id=user_id,
        )

    source_doc = new_doc_ver.document
    if not isinstance(new_docs, list):
        target_docs = [new_docs]
    else:
        target_docs = new_docs

    for doc in target_docs:
        logger.debug(f"Notifying index to add doc.title={doc.title} doc.id={doc.id}")
        logger.debug(f"Doc last version={doc.versions[-1]}")

    notify_add_docs(db_session, [doc.id for doc in target_docs])
    notify_generate_previews(list([str(doc.id) for doc in target_docs]))

    logger.debug(
        "len(old_doc_ver.pages) == moved_pages_count: "
        f"{len(old_doc_ver.pages)} == {moved_pages_count}"
    )
    if len(old_doc_ver.pages) == moved_pages_count:
        # all source pages were extracted, document should
        # be deleted as its last version does not contain
        # any page
        delete_stmt = delete(orm.Node).where(orm.Node.id == old_doc_ver.document.id)
        logger.debug(
            f"DELETING source node: {delete_stmt}; document.id={old_doc_ver.document.id}"
        )
        db_session.execute(delete_stmt)
        db_session.commit()
        return [None, target_docs]

    notify_generate_previews(str(source_doc.id))
    return [source_doc, target_docs]


def extract_to_single_paged_docs(
    db_session,
    source_page_ids: List[uuid.UUID],
    target_folder_id: uuid.UUID,
    title_format: str,
    user_id: uuid.UUID,
) -> List[schema.Document]:
    """Extracts given pages into separate documents

    Each source page will end up in a separate document
    located in target folder.
    """
    pages = (
        db_session.execute(
            select(orm.Page)
            .where(orm.Page.id.in_(source_page_ids))
            .order_by(orm.Page.number)
        )
        .scalars()
        .all()
    )
    dst_folder = db_session.execute(
        select(orm.Folder).where(orm.Folder.id == target_folder_id)
    ).scalar()

    result = []

    for page in pages:
        title = f"{title_format}-{uuid.uuid4()}.pdf"

        attrs = schema.NewDocument(
            title=title,
            lang=pages[0].lang,
            parent_id=dst_folder.id,
            ocr_status=types.OCRStatusEnum.unknown,
        )
        new_doc, error = doc_dbapi.create_document(
            db_session,
            attrs=attrs,
            user_id=dst_folder.user_id,
        )
        result.append(new_doc)
        # create new document version with one page
        dst_doc, error = doc_dbapi.version_bump_from_pages(
            db_session, dst_document_id=new_doc.id, pages=[page]
        )

        reuse_ocr_data(
            source_ids=[page.id], target_ids=[dst_doc.versions[0].pages[0].id]
        )

        copy_text_field(
            db_session=db_session,
            src=pages[0].document_version,
            dst=dst_doc.versions[0],
            page_numbers=[page.number],
        )

    return result


def extract_to_multi_paged_doc(
    db_session,
    source_page_ids: List[uuid.UUID],
    target_folder_id: uuid.UUID,
    title_format: str,
    user_id: uuid.UUID,
) -> schema.Document:
    """Extracts given pages into separate documents

    All source pages will end up in a single document
    located in target folder.
    """
    title = f"{title_format}-{uuid.uuid4()}.pdf"

    pages = (
        db_session.execute(
            select(orm.Page)
            .where(orm.Page.id.in_(source_page_ids))
            .order_by(orm.Page.number)
        )
        .scalars()
        .all()
    )
    first_page = pages[0]
    dst_folder = db_session.execute(
        select(orm.Folder).where(orm.Folder.id == target_folder_id)
    ).scalar()

    attrs = schema.NewDocument(
        title=title,
        lang=first_page.lang,
        parent_id=dst_folder.id,
        ocr_status=types.OCRStatusEnum.unknown,
    )
    new_doc, error = doc_dbapi.create_document(
        db_session,
        attrs=attrs,
        user_id=dst_folder.user_id,
    )

    dst_version, error = doc_dbapi.version_bump_from_pages(
        db_session, dst_document_id=new_doc.id, pages=pages
    )

    dst_pages = db_session.execute(
        select(orm.Page)
        .where(orm.Page.document_version_id == dst_version.id)
        .order_by(orm.Page.number)
    ).scalars()

    reuse_ocr_data(
        source_ids=[page.id for page in pages],
        target_ids=[page.id for page in dst_pages],
    )

    copy_text_field(
        db_session,
        src=pages[0].document_version,
        dst=dst_version,
        page_numbers=[p.number for p in pages],
    )

    return new_doc


def copy_without_pages(
    db_session, page_ids: List[uuid.UUID], user_id: uuid.UUID
) -> [schema.DocumentVersion, schema.DocumentVersion, int]:
    """Copy all pages  WHICH ARE NOT in `page_ids` list from src to dst

    All pages are assumed to be from same source document version.
    Source is the document version of the first page.
    Destination will be created as new document version.
    Destination will have all source pages WHICH ARE NOT in the `page_ids` list.

    The OCR data/page folder reused.
    Also sends INDEX UPDATE notification.
    """
    moved_pages = (
        db_session.execute(select(orm.Page).where(orm.Page.id.in_(page_ids)))
        .scalars()
        .all()
    )
    moved_page_ids = [page.id for page in moved_pages]

    src_first_page = moved_pages[0]
    src_old_version = src_first_page.document_version
    src_old_doc = src_old_version.document
    moved_pages_count = len(moved_pages)

    src_new_version = doc_dbapi.version_bump(
        db_session,
        doc_id=src_old_doc.id,
        page_count=len(src_old_version.pages) - moved_pages_count,
        short_description=f"{moved_pages_count} page(s) moved out",
        user_id=user_id,
    )

    copy_pdf(
        src=src_old_version.file_path,
        dst=src_new_version.file_path,
        page_numbers=[page.number for page in moved_pages],
    )

    src_old_version_page_ids = db_session.execute(
        select(orm.Page.id)
        .where(orm.Page.document_version_id == src_old_version.id)
        .order_by("number")
    ).scalars()

    src_keys = [  # IDs of the pages which were not removed
        page_id
        for page_id in src_old_version_page_ids.all()
        if not (page_id in moved_page_ids)  # Notice the negation
    ]

    dst_values = db_session.execute(
        select(orm.Page.id)
        .where(orm.Page.document_version_id == src_new_version.id)
        .order_by("number")
    ).scalars()

    if not_copied_ids := reuse_ocr_data(src_keys, dst_values.all()):
        logger.info(f"Pages with IDs {not_copied_ids} do not have OCR data")

    page_numbers = [
        p.number
        for p in src_old_version.pages
        if not (p.id in moved_page_ids)  # Notice the negation
    ]

    copy_text_field(
        db_session, src=src_old_version, dst=src_new_version, page_numbers=page_numbers
    )

    notify_version_update(
        remove_ver_id=str(src_old_version.id), add_ver_id=str(src_new_version.id)
    )

    db_session.commit()

    return [
        src_old_version,  # orig. ver where pages were copied from
        src_new_version,  # ver where pages were copied to
        moved_pages_count,  # how many pages moved
    ]


def get_docver_ids(db_session, document_ids: list[uuid.UUID]) -> list[uuid.UUID]:
    """Returns list of all document version IDs belonging to
    documents identified by IDs=document_ids
    """
    stmt = select(orm.DocumentVersion.id).where(
        orm.DocumentVersion.document_id.in_(document_ids)
    )
    return db_session.execute(stmt).scalars()


@if_redis_present
def notify_version_update(add_ver_id: str, remove_ver_id: str):
    # Send tasks to the index to remove/add pages
    tasks.send_task(
        const.INDEX_UPDATE,
        kwargs={"add_ver_id": add_ver_id, "remove_ver_id": str(remove_ver_id)},
        route_name="i3",
    )

    tasks.send_task(
        const.S3_WORKER_ADD_DOC_VER,
        kwargs={"doc_ver_ids": [add_ver_id]},
        route_name="s3",
    )
    tasks.send_task(
        const.S3_WORKER_REMOVE_DOC_VER,
        kwargs={"doc_ver_ids": [remove_ver_id]},
        route_name="s3",
    )


@if_redis_present
def notify_add_docs(db_session, add_doc_ids: List[uuid.UUID]):
    # send task to index
    logger.debug(f"Sending task {const.INDEX_ADD_DOCS} with {add_doc_ids}")
    tasks.send_task(
        const.INDEX_ADD_DOCS,
        kwargs={
            "doc_ids": [str(i) for i in add_doc_ids],
        },
        route_name="i3",
    )

    ids = [
        str(doc_id) for doc_id in get_docver_ids(db_session, document_ids=add_doc_ids)
    ]

    tasks.send_task(
        const.S3_WORKER_ADD_DOC_VER,
        kwargs={"doc_ver_ids": ids},
        route_name="s3",
    )


@if_redis_present
def notify_generate_previews(doc_id: list[str] | str):
    if isinstance(doc_id, str):
        tasks.send_task(
            const.S3_WORKER_GENERATE_PREVIEW,
            kwargs={"doc_id": doc_id},
            route_name="s3preview",
        )
        return
    elif isinstance(doc_id, list):
        for item in doc_id:
            tasks.send_task(
                const.S3_WORKER_GENERATE_PREVIEW,
                kwargs={"doc_id": item},
                route_name="s3preview",
            )
    else:
        raise ValueError(f"Unexpected type of doc_id: {type(doc_id)}")
