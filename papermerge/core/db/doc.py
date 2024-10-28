import itertools
import uuid
from datetime import datetime
from typing import Optional
from uuid import UUID

from sqlalchemy import delete, func, insert, select, text, update
from sqlalchemy.orm import Session

from papermerge.core import schemas
from papermerge.core.constants import INCOMING_DATE_FORMAT
from papermerge.core.db.models import (
    ColoredTag,
    CustomField,
    CustomFieldValue,
    Document,
    DocumentVersion,
    Page,
)
from papermerge.core.exceptions import InvalidDateFormat
from papermerge.core.features.document_types.db import document_type_cf_count
from papermerge.core.types import OrderEnum

from .common import get_ancestors


def str2date(value: str | None) -> Optional[datetime.date]:
    """Convert incoming user string to datetime.date"""
    # 10 = 4 Y chars +  1 "-" char + 2 M chars + 1 "-" char + 2 D chars
    if value is None:
        return None

    DATE_LEN = 10
    stripped_value = value.strip()
    if len(stripped_value) == 0:
        return None

    if len(stripped_value) < DATE_LEN and len(stripped_value) > 0:
        raise InvalidDateFormat(
            f"{stripped_value} expected to have at least {DATE_LEN} characters"
        )

    return datetime.strptime(
        value[:DATE_LEN],
        INCOMING_DATE_FORMAT,
    ).date()


def get_doc(
    session: Session,
    id: UUID,
    user_id: UUID,
) -> schemas.Document:
    stmt_doc = select(Document).where(Document.id == id, Document.user_id == user_id)
    db_doc = session.scalars(stmt_doc).one()
    breadcrumb = get_ancestors(session, id)
    db_doc.breadcrumb = breadcrumb

    stmt_doc_ver = (
        select(DocumentVersion)
        .where(
            DocumentVersion.document_id == id,
        )
        .order_by("number")
    )
    db_doc_vers = session.scalars(stmt_doc_ver).all()

    stmt_pages = select(Page).where(Document.id == id)
    db_pages = session.scalars(stmt_pages).all()

    db_doc.versions = list(
        [
            schemas.DocumentVersion.model_validate(db_doc_ver)
            for db_doc_ver in db_doc_vers
        ]
    )
    colored_tags_stmt = select(ColoredTag).where(ColoredTag.object_id == id)
    colored_tags = session.scalars(colored_tags_stmt).all()
    db_doc.tags = [ct.tag for ct in colored_tags]

    def get_page(doc_ver_id):
        result = []
        for db_page in db_pages:
            if db_page.document_version_id == doc_ver_id:
                result.append(db_page)

        return sorted(result, key=lambda x: x.number)

    for version in db_doc.versions:
        pages = get_page(version.id)
        version.pages = list([schemas.Page.model_validate(page) for page in pages])
    model_doc = schemas.Document.model_validate(db_doc)

    return model_doc


def get_doc_cfv(session: Session, document_id: UUID) -> list[schemas.CFV]:
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
            doc.basetreenode_ptr_id AS doc_id,
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
        FROM core_document AS doc
        JOIN document_type_custom_field AS dtcf ON dtcf.document_type_id = doc.document_type_id
        JOIN(
            SELECT
                sub_cf1.id AS cf_id,
                sub_cf1.name AS cf_name,
                sub_cf1.type AS cf_type,
                sub_cf1.extra_data AS cf_extra_data
            FROM core_document AS sub_doc1
            JOIN document_type_custom_field AS sub_dtcf1
                ON sub_dtcf1.document_type_id = sub_doc1.document_type_id
            JOIN custom_fields AS sub_cf1
                ON sub_cf1.id = sub_dtcf1.custom_field_id
            WHERE sub_doc1.basetreenode_ptr_id = :document_id
        ) AS cf ON cf.cf_id = dtcf.custom_field_id
        LEFT OUTER JOIN custom_field_values AS cfv
            ON cfv.field_id = cf.cf_id AND cfv.document_id = :document_id
    WHERE
        doc.basetreenode_ptr_id = :document_id
    """
    result = []
    str_doc_id = str(document_id).replace("-", "")
    for row in session.execute(text(stmt), {"document_id": str_doc_id}):
        if row.cf_type == "date":
            value = str2date(row.cf_value)
        else:
            value = row.cf_value

        result.append(
            schemas.CFV(
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


def update_doc_type(session: Session, document_id: UUID, document_type_id: UUID | None):
    stmt = select(Document).where(Document.id == document_id)
    doc = session.scalars(stmt).one()
    if doc.document_type_id != document_type_id:
        # new value for document type
        doc.document_type_id = document_type_id
        # -> clear existing CFV
        del_stmt = delete(CustomFieldValue).where(
            CustomFieldValue.document_id == document_id
        )
        session.execute(del_stmt)

    session.commit()


def update_doc_cfv(
    session: Session,
    document_id: UUID,
    custom_fields: dict,
) -> list[schemas.CFV]:
    """
    Update document's custom field values
    """
    items = get_doc_cfv(session, document_id=document_id)
    insert_values = []
    update_values = []

    stmt = (
        select(CustomField.name)
        .select_from(CustomFieldValue)
        .join(CustomField)
        .where(CustomFieldValue.document_id == document_id)
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
        session.execute(insert(CustomFieldValue), insert_values)

    if len(update_values) > 0:
        session.execute(update(CustomFieldValue), update_values)

    session.commit()

    return items


def get_docs_count_by_type(session: Session, type_id: UUID):
    """Returns number of documents of specific document type"""
    stmt = (
        select(func.count())
        .select_from(Document)
        .where(Document.document_type_id == type_id)
    )

    return session.scalars(stmt).one()


STMT_WITH_ORDER_BY = """
SELECT node.title,
    doc.basetreenode_ptr_id AS doc_id,
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
    FROM core_document AS doc
    JOIN (
      SELECT sub2_doc.basetreenode_ptr_id AS doc_id,
      CASE
        WHEN sub2_cf.type = 'monetary' THEN CAST(sub2_cfv.value_monetary AS VARCHAR)
        WHEN sub2_cf.type = 'text' THEN CAST(sub2_cfv.value_text AS VARCHAR)
        WHEN sub2_cf.type = 'date' THEN CAST(sub2_cfv.value_date AS VARCHAR)
        WHEN sub2_cf.type = 'boolean' THEN CAST(sub2_cfv.value_boolean AS VARCHAR)
      END AS cf_value
      FROM core_document AS sub2_doc
      JOIN document_type_custom_field AS sub2_dtcf ON sub2_dtcf.document_type_id = sub2_doc.document_type_id
      JOIN custom_fields AS sub2_cf ON sub2_cf.id = sub2_dtcf.custom_field_id
      LEFT OUTER JOIN custom_field_values AS sub2_cfv
          ON sub2_cfv.field_id = sub2_cf.id AND sub2_cfv.document_id = sub2_doc.basetreenode_ptr_id
      WHERE sub2_doc.document_type_id = :document_type_id AND sub2_cf.name = :custom_field_name
    ) AS ordered_doc ON ordered_doc.doc_id = doc.basetreenode_ptr_id
    JOIN core_basetreenode AS node
        ON node.id = doc.basetreenode_ptr_id
    JOIN document_type_custom_field AS dtcf ON dtcf.document_type_id = doc.document_type_id
    JOIN(
        SELECT
            sub_cf1.id AS cf_id,
            sub_cf1.name AS cf_name,
            sub_cf1.type AS cf_type,
            sub_cf1.extra_data AS cf_extra_data
        FROM document_types AS sub_dt1
        JOIN document_type_custom_field AS sub_dtcf1
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
        doc.basetreenode_ptr_id AS doc_id,
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
    FROM core_document AS doc
    JOIN core_basetreenode AS node
      ON node.id = doc.basetreenode_ptr_id
    JOIN document_type_custom_field AS dtcf ON dtcf.document_type_id = doc.document_type_id
    JOIN(
        SELECT
            sub_cf1.id AS cf_id,
            sub_cf1.name AS cf_name,
            sub_cf1.type AS cf_type,
            sub_cf1.extra_data AS cf_extra_data
        FROM document_types AS sub_dt1
        JOIN document_type_custom_field AS sub_dtcf1
            ON sub_dtcf1.document_type_id = sub_dt1.id
        JOIN custom_fields AS sub_cf1
            ON sub_cf1.id = sub_dtcf1.custom_field_id
        WHERE sub_dt1.id = :document_type_id
    ) AS cf ON cf.cf_id = dtcf.custom_field_id
    LEFT OUTER JOIN custom_field_values AS cfv
        ON cfv.field_id = cf.cf_id AND cfv.document_id = doc.basetreenode_ptr_id
    WHERE doc.document_type_id = :document_type_id
"""

PAGINATION = " LIMIT {limit} OFFSET {offset} "


def get_docs_by_type(
    session: Session,
    type_id: UUID,
    user_id: UUID,
    order_by: str | None = None,
    order: OrderEnum = OrderEnum.desc,
    page_number: int = 1,
    page_size: int = 5,
) -> list[schemas.DocumentCFV]:
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
            schemas.DocumentCFV(
                id=doc_id,
                title=items[0].title,
                document_type_id=doc_type_id,
                custom_fields=custom_fields,
            )
        )

    return results
