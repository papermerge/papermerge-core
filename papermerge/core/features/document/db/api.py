import io
import logging
import itertools
import os
from os.path import getsize
import uuid
import img2pdf
from pikepdf import Pdf
import tempfile
from pathlib import Path

from typing import Tuple

from sqlalchemy import delete, func, insert, select, text, update
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from papermerge.core.constants import ContentType
from papermerge.core.lib.storage import copy_file
from papermerge.core.types import OCRStatusEnum
from papermerge.core.features.custom_fields.db import orm as cf_orm
from papermerge.core.features.document import schema
from papermerge.core.features.document.db import orm as doc_orm
from papermerge.core.features.document_types.db.api import document_type_cf_count
from papermerge.core.types import OrderEnum
from papermerge.core.utils.misc import str2date
from papermerge.core.schemas import error as err_schema
from papermerge.core.pathlib import (
    abs_docver_path,
)


logger = logging.getLogger(__name__)


def get_last_doc_ver(
    db_session: Session,
    doc_id: uuid.UUID,  # noqa
    user_id: uuid.UUID,
) -> doc_orm.DocumentVersion:
    """
    Returns last version of the document
    identified by doc_id
    """

    stmt = (
        select(doc_orm.DocumentVersion)
        .join(doc_orm.Document)
        .where(
            doc_orm.DocumentVersion.document_id == doc_id,
            doc_orm.Document.user_id == user_id,
        )
        .order_by(doc_orm.DocumentVersion.number.desc())
        .limit(1)
    )
    return db_session.scalars(stmt).one()


def get_first_page(
    db_session: Session,
    doc_ver_id: uuid.UUID,
) -> doc_orm.Page:
    """
    Returns first page of the document version
    identified by doc_ver_id
    """
    with db_session as session:  # noqa
        stmt = (
            select(doc_orm.Page)
            .where(
                doc_orm.Page.document_version_id == doc_ver_id,
            )
            .order_by(doc_orm.Page.number.asc())
            .limit(1)
        )

        db_page = session.scalars(stmt).one()

    return db_page


def get_doc_ver(
    db_session: Session,
    id: uuid.UUID,
    user_id: uuid.UUID,  # noqa
) -> schema.DocumentVersion:
    """
    Returns last version of the document
    identified by doc_id
    """

    stmt = (
        select(doc_orm.DocumentVersion)
        .join(doc_orm.Document)
        .where(doc_orm.Document.user_id == user_id, doc_orm.DocumentVersion.id == id)
    )
    db_doc_ver = db_session.scalars(stmt).one()
    model_doc_ver = schema.DocumentVersion.model_validate(db_doc_ver)

    return model_doc_ver


def count_docs(session: Session) -> int:
    stmt = select(func.count()).select_from(doc_orm.Document)

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

    stmt = """
        SELECT
            doc.node_id AS doc_id,
            doc.document_type_id,
            cf.cf_id AS cf_id,
            cf.cf_name,
            cf.cf_type AS cf_type,
            cf.cf_extra_data,
            cfv.id AS cfv_id,
            CASE
                WHEN cf.cf_type = 'monetary' THEN CAST(cfv.value_monetary AS VARCHAR)
                WHEN cf.cf_type = 'text' THEN CAST(cfv.value_text AS VARCHAR)
                WHEN cf.cf_type = 'date' THEN CAST(cfv.value_date AS VARCHAR)
                WHEN cf.cf_type = 'boolean' THEN CAST(cfv.value_boolean AS VARCHAR)
            END AS cf_value
        FROM documents AS doc
        JOIN document_types_custom_fields AS dtcf ON dtcf.document_type_id = doc.document_type_id
        JOIN(
            SELECT
                sub_cf1.id AS cf_id,
                sub_cf1.name AS cf_name,
                sub_cf1.type AS cf_type,
                sub_cf1.extra_data AS cf_extra_data
            FROM documents AS sub_doc1
            JOIN document_types_custom_fields AS sub_dtcf1
                ON sub_dtcf1.document_type_id = sub_doc1.document_type_id
            JOIN custom_fields AS sub_cf1
                ON sub_cf1.id = sub_dtcf1.custom_field_id
            WHERE sub_doc1.node_id = :document_id
        ) AS cf ON cf.cf_id = dtcf.custom_field_id
        LEFT OUTER JOIN custom_field_values AS cfv
            ON cfv.field_id = cf.cf_id AND cfv.document_id = :document_id
    WHERE
        doc.node_id = :document_id
    """
    result = []
    str_doc_id = str(document_id).replace("-", "")
    for row in session.execute(text(stmt), {"document_id": str_doc_id}):
        if row.cf_type == "date":
            value = str2date(row.cf_value)
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
        select(cf_orm.CustomField.name)
        .select_from(cf_orm.CustomFieldValue)
        .join(cf_orm.CustomField)
        .where(cf_orm.CustomFieldValue.document_id == document_id)
    )
    existing_cf_name = [row[0] for row in session.execute(stmt).all()]

    for item in items:
        if item.name not in custom_fields.keys():
            continue

        if item.name not in existing_cf_name:
            # prepare insert values
            v = dict(
                id=uuid.uuid4(),
                document_id=item.document_id,
                field_id=item.custom_field_id,
            )
            if item.type.value == "date":
                v[f"value_{item.type.value}"] = str2date(custom_fields[item.name])
            else:
                v[f"value_{item.type.value}"] = custom_fields[item.name]
            insert_values.append(v)
        else:
            # prepare update values
            v = dict(id=item.custom_field_value_id)
            if item.type == "date":
                v[f"value_{item.type.value}"] = str2date(custom_fields[item.name])
            else:
                v[f"value_{item.type.value}"] = custom_fields[item.name]
            update_values.append(v)

    if len(insert_values) > 0:
        session.execute(insert(cf_orm.CustomFieldValue), insert_values)

    if len(update_values) > 0:
        session.execute(update(cf_orm.CustomFieldValue), update_values)

    session.commit()

    return items


def update_doc_type(
    session: Session, document_id: uuid.UUID, document_type_id: uuid.UUID | None
):
    stmt = select(doc_orm.Document).where(doc_orm.Document.id == document_id)
    doc = session.scalars(stmt).one()
    if doc.document_type_id != document_type_id:
        # new value for document type
        doc.document_type_id = document_type_id
        # -> clear existing CFV
        del_stmt = delete(cf_orm.CustomFieldValue).where(
            cf_orm.CustomFieldValue.document_id == document_id
        )
        session.execute(del_stmt)

    session.commit()


def get_docs_count_by_type(session: Session, type_id: uuid.UUID):
    """Returns number of documents of specific document type"""
    stmt = (
        select(func.count())
        .select_from(doc_orm.Document)
        .where(doc_orm.Document.document_type_id == type_id)
    )

    return session.scalars(stmt).one()


STMT_WITH_ORDER_BY = """
SELECT node.title,
    doc.node_id AS doc_id,
    doc.document_type_id,
    cf.cf_id AS cf_id,
    cf.cf_name,
    cf.cf_type AS cf_type,
    cf.cf_extra_data,
    cfv.value_monetary,
    cfv.id AS cfv_id,
    CASE
        WHEN cf.cf_type = 'monetary' THEN CAST(cfv.value_monetary AS VARCHAR)
        WHEN cf.cf_type = 'text' THEN CAST(cfv.value_text AS VARCHAR)
        WHEN cf.cf_type = 'date' THEN CAST(cfv.value_date AS VARCHAR)
        WHEN cf.cf_type = 'boolean' THEN CAST(cfv.value_boolean AS VARCHAR)
    END AS cf_value
    FROM documents AS doc
    JOIN (
      SELECT sub2_doc.node_id AS doc_id,
      CASE
        WHEN sub2_cf.type = 'monetary' THEN CAST(sub2_cfv.value_monetary AS VARCHAR)
        WHEN sub2_cf.type = 'text' THEN CAST(sub2_cfv.value_text AS VARCHAR)
        WHEN sub2_cf.type = 'date' THEN CAST(sub2_cfv.value_date AS VARCHAR)
        WHEN sub2_cf.type = 'boolean' THEN CAST(sub2_cfv.value_boolean AS VARCHAR)
      END AS cf_value
      FROM documents AS sub2_doc
      JOIN document_types_custom_fields AS sub2_dtcf ON sub2_dtcf.document_type_id = sub2_doc.document_type_id
      JOIN custom_fields AS sub2_cf ON sub2_cf.id = sub2_dtcf.custom_field_id
      LEFT OUTER JOIN custom_field_values AS sub2_cfv
          ON sub2_cfv.field_id = sub2_cf.id AND sub2_cfv.document_id = sub2_doc.node_id
      WHERE sub2_doc.document_type_id = :document_type_id AND sub2_cf.name = :custom_field_name
    ) AS ordered_doc ON ordered_doc.doc_id = doc.node_id
    JOIN nodes AS node
        ON node.id = doc.node_id
    JOIN document_types_custom_fields AS dtcf ON dtcf.document_type_id = doc.document_type_id
    JOIN(
        SELECT
            sub_cf1.id AS cf_id,
            sub_cf1.name AS cf_name,
            sub_cf1.type AS cf_type,
            sub_cf1.extra_data AS cf_extra_data
        FROM document_types AS sub_dt1
        JOIN documents_type_custom_fields AS sub_dtcf1
            ON sub_dtcf1.document_type_id = sub_dt1.id
        JOIN custom_fields AS sub_cf1
            ON sub_cf1.id = sub_dtcf1.custom_field_id
        WHERE sub_dt1.id = :document_type_id
    ) AS cf ON cf.cf_id = dtcf.custom_field_id
    LEFT OUTER JOIN custom_field_values AS cfv
        ON cfv.field_id = cf.cf_id AND cfv.document_id = doc_id
    WHERE doc.document_type_id = :document_type_id
    ORDER BY ordered_doc.cf_value {order}
"""

STMT = """
    SELECT node.title,
        doc.node_id AS doc_id,
        doc.document_type_id,
        cf.cf_id AS cf_id,
        cf.cf_name,
        cf.cf_type AS cf_type,
        cf.cf_extra_data,
        cfv.id AS cfv_id,
        CASE
            WHEN cf.cf_type = 'monetary' THEN CAST(cfv.value_monetary AS VARCHAR)
            WHEN cf.cf_type = 'text' THEN CAST(cfv.value_text AS VARCHAR)
            WHEN cf.cf_type = 'date' THEN CAST(cfv.value_date AS VARCHAR)
            WHEN cf.cf_type = 'boolean' THEN CAST(cfv.value_boolean AS VARCHAR)
        END AS cf_value
    FROM documents AS doc
    JOIN nodes AS node
      ON node.id = doc.node_id
    JOIN document_types_custom_fields AS dtcf ON dtcf.document_type_id = doc.document_type_id
    JOIN(
        SELECT
            sub_cf1.id AS cf_id,
            sub_cf1.name AS cf_name,
            sub_cf1.type AS cf_type,
            sub_cf1.extra_data AS cf_extra_data
        FROM document_types AS sub_dt1
        JOIN document_types_custom_fields AS sub_dtcf1
            ON sub_dtcf1.document_type_id = sub_dt1.id
        JOIN custom_fields AS sub_cf1
            ON sub_cf1.id = sub_dtcf1.custom_field_id
        WHERE sub_dt1.id = :document_type_id
    ) AS cf ON cf.cf_id = dtcf.custom_field_id
    LEFT OUTER JOIN custom_field_values AS cfv
        ON cfv.field_id = cf.cf_id AND cfv.document_id = doc.node_id
    WHERE doc.document_type_id = :document_type_id
"""

PAGINATION = " LIMIT {limit} OFFSET {offset} "


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

    str_type_id = str(type_id).replace("-", "")
    results = []
    cf_count = document_type_cf_count(session, document_type_id=type_id)

    if order_by is None:
        stmt = STMT + PAGINATION.format(
            limit=cf_count * page_size, offset=cf_count * (page_number - 1) * page_size
        )
        params = {"document_type_id": str_type_id}
        rows = session.execute(text(stmt), params)
    else:
        stmt = STMT_WITH_ORDER_BY.format(order=order.value) + PAGINATION.format(
            limit=cf_count * page_size, offset=cf_count * (page_number - 1) * page_size
        )
        params = {"document_type_id": str_type_id, "custom_field_name": order_by}
        rows = session.execute(text(stmt), params)

    for document_id, group in itertools.groupby(rows, lambda r: r.doc_id):
        items = sorted(list(group), key=lambda x: x.cf_name)
        custom_fields = []

        for item in items:
            if item.cf_type == "date":
                value = str2date(item.cf_value)
            else:
                value = item.cf_value
            custom_fields.append((item.cf_name, value, item.cf_type))

        if isinstance(document_id, uuid.UUID):
            # postgres
            doc_id = document_id
        else:
            # sqlite
            doc_id = uuid.UUID(document_id)

        if isinstance(items[0].document_type_id, uuid.UUID):
            # postgres
            doc_type_id = items[0].document_type_id
        else:
            # sqlite
            doc_type_id = uuid.UUID(items[0].document_type_id)

        results.append(
            schema.DocumentCFV(
                id=doc_id,
                title=items[0].title,
                document_type_id=doc_type_id,
                custom_fields=custom_fields,
            )
        )

    return results


def create_document(
    db_session: Session, attrs: schema.NewDocument, user_id: uuid.UUID
) -> Tuple[schema.Document | None, err_schema.Error | None]:
    error = None
    doc_id = attrs.id or uuid.uuid4()
    doc = doc_orm.Document(
        id=doc_id,
        title=attrs.title,
        ctype="document",
        ocr_status=OCRStatusEnum.unknown,
        parent_id=attrs.parent_id,
        ocr=attrs.ocr,
        lang=attrs.lang,
        user_id=user_id,
    )
    doc_ver = doc_orm.DocumentVersion(
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
            attr_err = err_schema.AttrError(
                name="title", message="Within a folder title must be unique"
            )
            error = err_schema.Error(attrs=[attr_err])
        # sqlite unique integrity error
        elif "UNIQUE" in stre and ".title" in stre:
            attr_err = err_schema.AttrError(
                name="title", message="Within a folder title must be unique"
            )
            error = err_schema.Error(attrs=[attr_err])
        else:
            error = err_schema.Error(messages=[stre])

    return schema.Document.model_validate(doc), error


def version_bump(
    db_session: Session,
    doc_id: uuid.UUID,
    user_id: uuid.UUID,
    page_count: int | None = None,
    short_description: str | None = None,
) -> doc_orm.DocumentVersion:
    """Increment document version"""

    last_ver = get_last_doc_ver(db_session, doc_id=doc_id, user_id=user_id)
    new_page_count = page_count or last_ver.page_count
    db_new_doc_ver = doc_orm.DocumentVersion(
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
        db_page = doc_orm.Page(
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
    pages: list[doc_orm.Page],
) -> [doc_orm.Document | None, err_schema.Error | None]:
    """
    Creates new version for the document `dst-document-id`

    PDF pages in the newly create document version is copied
    from ``pages``.
    """
    first_page = pages[0]
    page_count = len(pages)
    error = None
    stmt = (
        select(doc_orm.DocumentVersion)
        .where(
            doc_orm.DocumentVersion.document_id == dst_document_id,
            doc_orm.DocumentVersion.size == 0,
        )
        .order_by(doc_orm.DocumentVersion.number.desc())
    )
    dst_doc = db_session.get(doc_orm.Document, dst_document_id)
    dst_document_version = db_session.execute(stmt).scalar()

    if not dst_document_version:
        dst_document_version = doc_orm.DocumentVersion(
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
        db_page = doc_orm.Page(
            document_version_id=dst_document_version.id,
            number=page_number,
            page_count=page_count,
            lang=dst_doc.lang,
        )
        db_session.add(db_page)
    try:
        db_session.commit()
    except Exception as e:
        error = err_schema.Error(messages=[str(e)])
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
        select(doc_orm.Page.id, doc_orm.Page.text)
        .where(doc_orm.Page.document_version_id == document_version_id)
        .order_by(doc_orm.Page.number)
    )

    pages = [(row.id, row.text) for row in db_session.execute(stmt)]
    for page, stream in zip(pages, streams):
        if page[1] is None:  # page.text
            txt = stream.read()
            sql = (
                update(doc_orm.Page).where(doc_orm.Page.id == page[0]).values(text=txt)
            )
            db_session.execute(sql)
            text.append(txt.strip())

    stripped_text = " ".join(text)
    stripped_text = stripped_text.strip()
    if stripped_text:
        sql = (
            update(doc_orm.DocumentVersion)
            .where(doc_orm.DocumentVersion.id == document_version_id)
            .values(text=stripped_text)
        )
        db_session.execute(sql)


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
    doc: doc_orm.Document,
    file_name,
    file_size,
    short_description=None,
) -> doc_orm.DocumentVersion:
    stmt = (
        select(doc_orm.DocumentVersion)
        .where(
            doc_orm.DocumentVersion.size == 0,
            doc_orm.DocumentVersion.document_id == doc.id,
        )
        .order_by(doc_orm.DocumentVersion.number.desc())
    )
    document_version = db_session.execute(stmt).scalar()

    if not document_version:
        document_version = doc_orm.DocumentVersion(
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
) -> [schema.Document | None, err_schema.Error | None]:

    doc = db_session.get(doc_orm.Document, document_id)

    if content_type != ContentType.APPLICATION_PDF:
        try:
            with tempfile.TemporaryDirectory() as tmpdirname:
                tmp_file_path = Path(tmpdirname) / f"{file_name}.pdf"
                with open(tmp_file_path, "wb") as f:
                    pdf_content = img2pdf.convert(content)
                    f.write(pdf_content)
        except img2pdf.ImageOpenError as e:
            error = err_schema.Error(messages=[str(e)])
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
            db_page_orig = doc_orm.Page(
                number=page_number,
                page_count=page_count,
                lang=pdf_ver.lang,
                document_version_id=orig_ver.id,
            )
            db_page_pdf = doc_orm.Page(
                number=page_number,
                page_count=page_count,
                lang=pdf_ver.lang,
                document_version_id=pdf_ver.id,
            )
            db_session.add_all([db_page_orig, db_page_pdf])

    else:
        # pdf_ver == orig_ver
        pdf_ver = create_next_version(
            db_session, doc=doc, file_name=file_name, file_size=size
        )
        copy_file(src=content, dst=abs_docver_path(pdf_ver.id, pdf_ver.file_name))

        page_count = get_pdf_page_count(content)
        pdf_ver.page_count = page_count
        for page_number in range(1, page_count + 1):
            db_page_pdf = doc_orm.Page(
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
        error = err_schema.Error(messages=[str(e)])
        return None, error

    return schema.Document.model_validate(doc), None
