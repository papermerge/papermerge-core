import io
import logging
import os
from os.path import getsize
import uuid
import img2pdf
from pikepdf import Pdf
import tempfile
from pathlib import Path

from typing import Tuple

from sqlalchemy import delete, func, insert, select, update, Select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import joinedload


from papermerge.core.db.engine import Session
from papermerge.core.utils.misc import copy_file
from papermerge.core import schema, orm, constants, tasks
from papermerge.core.features.document_types.db.api import document_type_cf_count
from papermerge.core.types import OrderEnum, CFVValueColumn
from papermerge.core.db.common import get_ancestors
from papermerge.core.utils.misc import str2date, str2float, float2str
from papermerge.core.pathlib import (
    abs_docver_path,
)
from papermerge.core.features.document.schema import DocumentCFVRow
from papermerge.core.features.document.ordered_document_cfv import OrderedDocumentCFV
from papermerge.core import config

from .selectors import select_doc_cfv, select_docs_by_type

settings = config.get_settings()

logger = logging.getLogger(__name__)


def count_docs(session: Session) -> int:
    stmt = select(func.count()).select_from(orm.Document)

    return session.scalars(stmt).one()


def get_doc_cfv(session: Session, document_id: uuid.UUID) -> list[schema.CFV]:
    """
    Fetch document's custom field values for each CF name, even if CFV is NULL

    Example: Say there is one document with ID=123 and document type Grocery.
    Document type Grocery has 3 custom fields: Shop, Total, Date.

    get_doc_cfv(ID=123) will return one list with 3 items in it:

    1. doc_id=123 cf_name=Shop cf_value=None
    2. doc_id=123 cf_name=Total cf_value=17.29
    3. doc_id=123 cf_name=Date cf_value=None

    Notice that item 1 and 3 have cf_value=None, which indicates
    that there is no value for it in `custom_field_values` table.
    """

    stmt = select_doc_cfv(document_id)
    result = []
    for row in session.execute(stmt):
        if row.cf_type == "date":
            value = str2date(row.cf_value)
        elif row.cf_type == "yearmonth":
            value = float2str(row.cf_value)
        else:
            value = row.cf_value

        result.append(
            schema.CFV(
                document_id=row.doc_id,
                document_type_id=row.document_type_id,
                custom_field_id=row.cf_id,
                name=row.cf_name,
                type=row.cf_type,
                extra_data=row.cf_extra_data,
                custom_field_value_id=row.cfv_id,
                value=value,
            )
        )

    return result


def update_doc_cfv(
    session: Session,
    document_id: uuid.UUID,
    custom_fields: dict,
) -> list[schema.CFV]:
    """
    Update document's custom field values
    """
    items = get_doc_cfv(session, document_id=document_id)
    insert_values = []
    update_values = []

    stmt = (
        select(orm.CustomField.name)
        .select_from(orm.CustomFieldValue)
        .join(orm.CustomField)
        .where(orm.CustomFieldValue.document_id == document_id)
    )
    existing_cf_name = [row[0] for row in session.execute(stmt).all()]
    for item in items:
        if item.name not in custom_fields.keys():
            continue

        if item.name not in existing_cf_name:
            # prepare insert values
            v = dict(
                id=uuid.uuid4(),
                document_id=document_id,
                field_id=item.custom_field_id,
            )
            if item.type.value == "date":
                v[f"value_{item.type.value}"] = str2date(custom_fields[item.name])
            elif item.type.value == "yearmonth":
                v[f"value_{item.type.value}"] = str2float(custom_fields[item.name])
            else:
                v[f"value_{item.type.value}"] = custom_fields[item.name]
            insert_values.append(v)
        else:
            # prepare update values
            v = dict(id=item.custom_field_value_id)
            if item.type == "date":
                v[f"value_{item.type.value}"] = str2date(custom_fields[item.name])
            elif item.type.value == "yearmonth":
                v[f"value_{item.type.value}"] = str2float(custom_fields[item.name])
            else:
                v[f"value_{item.type.value}"] = custom_fields[item.name]
            update_values.append(v)

    if len(insert_values) > 0:
        session.execute(insert(orm.CustomFieldValue), insert_values)

    if len(update_values) > 0:
        session.execute(update(orm.CustomFieldValue), update_values)

    session.commit()

    return items


def update_doc_type(
    session: Session,
    *,
    document_id: uuid.UUID,
    user_id: uuid.UUID,
    document_type_id: uuid.UUID | None,
):
    stmt = select(orm.Document).where(
        orm.Document.id == document_id, orm.Document.user_id == user_id
    )
    doc = session.scalars(stmt).one()
    if doc.document_type_id != document_type_id:
        # new value for document type
        doc.document_type_id = document_type_id
        # -> clear existing CFV
        del_stmt = delete(orm.CustomFieldValue).where(
            orm.CustomFieldValue.document_id == document_id
        )
        session.execute(del_stmt)

    session.commit()


def get_docs_count_by_type(session: Session, type_id: uuid.UUID):
    """Returns number of documents of specific document type"""
    stmt = (
        select(func.count())
        .select_from(orm.Document)
        .where(orm.Document.document_type_id == type_id)
    )

    return session.scalars(stmt).one()


def get_cfv_column_name(db_session, cf_name: str) -> CFVValueColumn:
    value = db_session.execute(
        select(orm.CustomField.type).where(
            orm.CustomField.name == cf_name
        )
    ).scalar()

    match value:
        case "text":
            ret = CFVValueColumn.TEXT
        case "monetary":
            ret = CFVValueColumn.MONETARY
        case "date":
            ret = CFVValueColumn.DATE
        case "boolean":
            ret = CFVValueColumn.BOOLEAN
        case "yearmonth":
            ret = CFVValueColumn.YEARMONTH
        case "int":
            ret = CFVValueColumn.INT
        case "float":
            ret = CFVValueColumn.FLOAT
        case _:
            raise ValueError("Unexpected custom field type")

    return ret


def get_docs_by_type(
    session: Session,
    type_id: uuid.UUID,
    user_id: uuid.UUID,
    order_by: str | None = None,
    order: OrderEnum = OrderEnum.desc,
    page_number: int = 1,
    page_size: int = 5,
) -> list[schema.DocumentCFV]:
    """
    Returns list of documents + doc CFv for all documents with of given type
    """
    if page_number < 1:
        raise ValueError(f"page_number must be >= 1; got value={page_number}")

    if page_size < 1:
        raise ValueError(f"page_size must be >= 1; got value={page_size}")

    cf_count = document_type_cf_count(session, document_type_id=type_id)

    if order_by is None:
        stmt = select_docs_by_type(
            document_type_id=type_id,
            user_id=user_id,
            limit=cf_count * page_size,
            offset=cf_count * (page_number - 1) * page_size
        )
    else:
        cfv_column_name = get_cfv_column_name(session, order_by)
        stmt = select_docs_by_type(
            document_type_id=type_id,
            user_id=user_id,
            order_by=order_by,
            order=order,
            cfv_column_name=cfv_column_name,
            limit=cf_count * page_size,
            offset=cf_count * (page_number - 1) * page_size
        )

    rows = session.execute(stmt)
    ordered_doc_cfvs = OrderedDocumentCFV()
    for row in rows:
        entry = DocumentCFVRow(
            title=row.title,
            doc_id=row.doc_id,
            document_type_id=row.document_type_id,
            cf_name=row.cf_name,
            cf_type=row.cf_type,
            cf_value=row.cf_value
        )
        ordered_doc_cfvs.add(entry)

    return list(ordered_doc_cfvs)


def create_document(
    db_session: Session, attrs: schema.NewDocument, user_id: uuid.UUID
) -> Tuple[schema.Document | None, schema.Error | None]:
    error = None
    doc_id = attrs.id or uuid.uuid4()
    doc = orm.Document(
        id=doc_id,
        title=attrs.title,
        ctype="document",
        ocr_status=attrs.ocr_status,
        parent_id=attrs.parent_id,
        ocr=attrs.ocr,
        lang=attrs.lang,
        user_id=user_id,
    )
    doc_ver = orm.DocumentVersion(
        id=uuid.uuid4(),
        document_id=doc_id,
        number=1,
        file_name=attrs.file_name,
        size=0,
        page_count=0,
        lang=attrs.lang,
        short_description="Original",
    )
    db_session.add(doc)

    try:
        db_session.add(doc_ver)
        db_session.commit()
    except IntegrityError as e:
        stre = str(e)
        # postgres unique integrity error
        if "unique" in stre and "title" in stre:
            attr_err = schema.AttrError(
                name="title", message="Within a folder title must be unique"
            )
            error = schema.Error(attrs=[attr_err])
        # sqlite unique integrity error
        elif "UNIQUE" in stre and ".title" in stre:
            attr_err = schema.AttrError(
                name="title", message="Within a folder title must be unique"
            )
            error = schema.Error(attrs=[attr_err])
        else:
            error = schema.Error(messages=[stre])

    return schema.Document.model_validate(doc), error


def version_bump(
    db_session: Session,
    doc_id: uuid.UUID,
    user_id: uuid.UUID,
    page_count: int | None = None,
    short_description: str | None = None,
) -> orm.DocumentVersion:
    """Increment document version"""

    last_ver = get_last_doc_ver(db_session, doc_id=doc_id, user_id=user_id)
    new_page_count = page_count or last_ver.page_count
    db_new_doc_ver = orm.DocumentVersion(
        document_id=doc_id,
        number=last_ver.number + 1,
        file_name=last_ver.file_name,
        size=0,
        page_count=page_count,
        short_description=short_description,
        lang=last_ver.lang,
    )

    db_session.add(db_new_doc_ver)

    for page_number in range(1, new_page_count + 1):
        db_page = orm.Page(
            document_version=db_new_doc_ver,
            number=page_number,
            page_count=new_page_count,
            lang=last_ver.lang,
        )
        db_session.add(db_page)

    db_session.commit()

    return db_new_doc_ver


def version_bump_from_pages(
    db_session: Session,
    dst_document_id: uuid.UUID,
    pages: list[orm.Page],
) -> [orm.Document | None, schema.Error | None]:
    """
    Creates new version for the document `dst-document-id`

    PDF pages in the newly create document version is copied
    from ``pages``.
    """
    first_page = pages[0]
    page_count = len(pages)
    error = None
    stmt = (
        select(orm.DocumentVersion)
        .where(
            orm.DocumentVersion.document_id == dst_document_id,
            orm.DocumentVersion.size == 0,
        )
        .order_by(orm.DocumentVersion.number.desc())
    )
    dst_doc = db_session.get(orm.Document, dst_document_id)
    dst_document_version = db_session.execute(stmt).scalar()

    if not dst_document_version:
        dst_document_version = orm.DocumentVersion(
            document_id=dst_document_id,
            number=len(dst_doc.versions) + 1,
            lang=dst_doc.lang,
        )

    source_pdf = Pdf.open(first_page.document_version.file_path)
    dst_pdf = Pdf.new()

    for page in pages:
        pdf_page = source_pdf.pages.p(page.number)
        dst_pdf.pages.append(pdf_page)

    dst_document_version.file_name = first_page.document_version.file_name
    dst_document_version.page_count = page_count

    dirname = os.path.dirname(dst_document_version.file_path)
    os.makedirs(dirname, exist_ok=True)

    dst_pdf.save(dst_document_version.file_path)

    dst_document_version.size = getsize(dst_document_version.file_path)

    for page_number in range(1, page_count + 1):
        db_page = orm.Page(
            document_version_id=dst_document_version.id,
            number=page_number,
            page_count=page_count,
            lang=dst_doc.lang,
        )
        db_session.add(db_page)
    try:
        db_session.commit()
    except Exception as e:
        error = schema.Error(messages=[str(e)])
    finally:
        source_pdf.close()
        dst_pdf.close()

    if error:
        return None, error

    return dst_doc, None


def update_text_field(db_session, document_version_id: uuid.UUID, streams):
    """Update document versions's text field from IO streams.

    Arguments:
        ``streams`` - a list of IO text streams

    It will update text field of all associated pages first
    and then concatinate all text field into doc.text field.
    """
    text = []

    stmt = (
        select(orm.Page.id, orm.Page.text, orm.Page.number)
        .where(orm.Page.document_version_id == document_version_id)
        .order_by(orm.Page.number)
    )

    pages = [(row.id, row.text, row.number) for row in db_session.execute(stmt)]

    for page, stream in zip(pages, streams):
        if page[1] is None:  # page.text
            txt = stream.read()
            sql = update(orm.Page).where(orm.Page.id == page[0]).values(text=txt)
            db_session.execute(sql)
            text.append(txt.strip())

    stripped_text = " ".join(text)
    stripped_text = stripped_text.strip()
    if stripped_text:
        sql = (
            update(orm.DocumentVersion)
            .where(orm.DocumentVersion.id == document_version_id)
            .values(text=stripped_text)
        )
        db_session.execute(sql)
    db_session.commit()


class UploadStrategy:
    """
    Defines how to proceed with uploaded file
    """

    # INCREMENT - Uploaded file is inserted into the newly created
    #   document version
    INCREMENT = 1
    # MERGE - Uploaded file is merged with last file version
    #   and inserted into the newly created document version
    MERGE = 2


class FileType:
    PDF = "pdf"
    JPEG = "jpeg"
    PNG = "png"
    TIFF = "tiff"


def file_type(content_type: str) -> str:
    parts = content_type.split("/")
    if len(parts) == 2:
        return parts[1]

    raise ValueError(f"Invalid content type {content_type}")


def get_pdf_page_count(content: io.BytesIO | bytes) -> int:
    if isinstance(content, bytes):
        pdf = Pdf.open(io.BytesIO(content))
    else:
        pdf = Pdf.open(content)
    page_count = len(pdf.pages)
    pdf.close()

    return page_count


def create_next_version(
    db_session,
    doc: orm.Document,
    file_name,
    file_size,
    short_description=None,
) -> orm.DocumentVersion:
    stmt = (
        select(orm.DocumentVersion)
        .where(
            orm.DocumentVersion.size == 0,
            orm.DocumentVersion.document_id == doc.id,
        )
        .order_by(orm.DocumentVersion.number.desc())
    )
    document_version = db_session.execute(stmt).scalar()

    if not document_version:
        document_version = orm.DocumentVersion(
            id=uuid.uuid4(),
            document_id=doc.id,
            number=len(doc.versions) + 1,
            lang=doc.lang,
        )

    document_version.file_name = file_name
    document_version.size = file_size
    document_version.page_count = 0

    if short_description:
        document_version.short_description = short_description

    db_session.add(document_version)

    return document_version


def upload(
    db_session,
    document_id: uuid.UUID,
    content: io.BytesIO,
    size: int,
    file_name: str,
    content_type: str | None = None,
) -> [schema.Document | None, schema.Error | None]:

    doc = db_session.get(orm.Document, document_id)
    orig_ver = None

    if content_type != constants.ContentType.APPLICATION_PDF:
        try:
            with tempfile.TemporaryDirectory() as tmpdirname:
                tmp_file_path = Path(tmpdirname) / f"{file_name}.pdf"
                with open(tmp_file_path, "wb") as f:
                    pdf_content = img2pdf.convert(content)
                    f.write(pdf_content)
        except img2pdf.ImageOpenError as e:
            error = schema.Error(messages=[str(e)])
            return None, error

        orig_ver = create_next_version(
            db_session, doc=doc, file_name=file_name, file_size=size
        )

        pdf_ver = create_next_version(
            db_session,
            doc=doc,
            file_name=f"{file_name}.pdf",
            file_size=len(pdf_content),
            short_description=f"{file_type(content_type)} -> pdf",
        )
        copy_file(src=content, dst=abs_docver_path(orig_ver.id, orig_ver.file_name))

        copy_file(src=pdf_content, dst=abs_docver_path(pdf_ver.id, pdf_ver.file_name))

        page_count = get_pdf_page_count(pdf_content)
        orig_ver.page_count = page_count
        pdf_ver.page_count = page_count

        for page_number in range(1, page_count + 1):
            db_page_orig = orm.Page(
                number=page_number,
                page_count=page_count,
                lang=pdf_ver.lang,
                document_version_id=orig_ver.id,
            )
            db_page_pdf = orm.Page(
                number=page_number,
                page_count=page_count,
                lang=pdf_ver.lang,
                document_version_id=pdf_ver.id,
            )
            db_session.add_all([db_page_orig, db_page_pdf])

    else:
        pdf_ver = create_next_version(
            db_session, doc=doc, file_name=file_name, file_size=size
        )
        copy_file(src=content, dst=abs_docver_path(pdf_ver.id, pdf_ver.file_name))

        page_count = get_pdf_page_count(content)

        pdf_ver.page_count = page_count
        for page_number in range(1, page_count + 1):
            db_page_pdf = orm.Page(
                number=page_number,
                page_count=page_count,
                lang=pdf_ver.lang,
                document_version_id=pdf_ver.id,
            )
            db_session.add(db_page_pdf)
        db_session.add(pdf_ver)

    try:
        db_session.commit()
    except Exception as e:
        error = schema.Error(messages=[str(e)])
        return None, error

    validated_model = schema.Document.model_validate(doc)


    if orig_ver:
        # non PDF document
        # here `orig_ver` means - version which is not a PDF
        # may be Jpg, PNG or TIFF
        tasks.send_task(
            constants.S3_WORKER_ADD_DOC_VER,
            kwargs={"doc_ver_ids": [str(orig_ver.id)]},
            route_name="s3",
        )

    # PDF document
    tasks.send_task(
        constants.S3_WORKER_ADD_DOC_VER,
        kwargs={"doc_ver_ids": [str(pdf_ver.id)]},
        route_name="s3",
    )

    if not settings.papermerge__ocr__automatic:
        if doc.ocr is True:
            # user chose "schedule OCR" when uploading document
            tasks.send_task(
                constants.WORKER_OCR_DOCUMENT,
                kwargs={
                    "document_id": str(doc.id),
                    "lang": doc.lang,
                },
                route_name="ocr",
            )

    return validated_model, None


def get_doc(
    session: Session,
    id: uuid.UUID,
    user_id: uuid.UUID,
) -> schema.Document:
    stmt_doc = select(orm.Document).where(
        orm.Document.id == id, orm.Document.user_id == user_id
    )
    db_doc = session.scalar(stmt_doc)
    breadcrumb = get_ancestors(session, id)
    db_doc.breadcrumb = breadcrumb

    # colored_tags = session.scalars(colored_tags_stmt).all()
    # db_doc.tags = [ct.tag for ct in colored_tags]

    model_doc = schema.Document.model_validate(db_doc)

    return model_doc


def get_page(
    db_session: Session, page_id: uuid.UUID, user_id: uuid.UUID
) -> schema.Page:

    stmt = (
        select(orm.Page)
        .join(orm.DocumentVersion)
        .join(orm.Document)
        .where(orm.Page.id == page_id, orm.Document.user_id == user_id)
    )

    db_page = db_session.execute(stmt).scalar()
    model = schema.Page.model_validate(db_page)

    return model


def get_doc_ver_pages(db_session: Session, doc_ver_id: uuid.UUID) -> list[schema.Page]:
    stmt = (
        select(orm.Page)
        .where(orm.Page.document_version_id == doc_ver_id)
        .order_by("number")
    )

    db_pages = db_session.scalars(stmt).all()
    models = [schema.Page.model_validate(db_page) for db_page in db_pages]

    return models


def get_last_doc_ver(
    db_session: Session,
    doc_id: uuid.UUID,  # noqa
    user_id: uuid.UUID,
) -> orm.DocumentVersion:
    """
    Returns last version of the document
    identified by doc_id
    """

    stmt = (
        select(orm.DocumentVersion)
        .join(orm.Document)
        .where(
            orm.DocumentVersion.document_id == doc_id,
            orm.Document.user_id == user_id,
        )
        .order_by(orm.DocumentVersion.number.desc())
        .limit(1)
    )
    return db_session.scalars(stmt).one()


def get_first_page(
    db_session: Session,
    doc_ver_id: uuid.UUID,
) -> orm.Page:
    """
    Returns first page of the document version
    identified by doc_ver_id
    """
    with db_session as session:  # noqa
        stmt = (
            select(orm.Page)
            .where(
                orm.Page.document_version_id == doc_ver_id,
            )
            .order_by(orm.Page.number.asc())
            .limit(1)
        )

        db_page = session.scalars(stmt).one()

    return db_page


def get_doc_ver(
    db_session: Session,
    *,
    document_version_id: uuid.UUID,
    user_id: uuid.UUID,
) -> orm.DocumentVersion:
    """
    Returns last version of the document
    identified by doc_id
    """

    stmt = (
        select(orm.DocumentVersion)
        .join(orm.Document)
        .options(joinedload(orm.DocumentVersion.pages))
        .where(
            orm.Document.user_id == user_id,
            orm.DocumentVersion.id == document_version_id,
        )
    )
    db_doc_ver = db_session.scalars(stmt).unique().one()

    return db_doc_ver


def select_last_doc_ver(document_id: uuid.UUID, user_id: uuid.UUID) -> Select:
    """Returns a selectable for the last version of the document"""
    stmt = (
        select(orm.DocumentVersion.id)
        .join(orm.Document)
        .where(
            orm.DocumentVersion.document_id == document_id,
            orm.Document.user_id == user_id,
        )
        .order_by(orm.DocumentVersion.number.desc())
        .limit(1)
    )

    return stmt


def get_last_ver_pages(
    db_session: Session, document_id: uuid.UUID, user_id: uuid.UUID
) -> list[orm.Page]:
    """Returns all pages of the last version of the document"""
    subq = select_last_doc_ver(document_id=document_id, user_id=user_id).subquery()

    stmt = (
        select(orm.Page)
        .where(orm.Page.document_version_id == subq.c.id)
        .order_by(orm.Page.number)
    )

    return db_session.execute(stmt).scalars().all()
