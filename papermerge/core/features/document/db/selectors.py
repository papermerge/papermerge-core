import uuid

from sqlalchemy import select, Select, case, func, VARCHAR
from sqlalchemy.orm import aliased

from papermerge.core import orm
from papermerge.core.types import OrderEnum, CFVValueColumn



# len(2024-11-02) + 1
DATE_LEN = 11

def _select_cf() -> Select:
    stmt = (
        select(
            orm.CustomField.id,
            orm.CustomField.name,
            orm.CustomField.type,
            orm.CustomField.extra_data)
        .select_from(orm.Document)
        .join(
            orm.DocumentTypeCustomField,
            orm.DocumentTypeCustomField.document_type_id == orm.Document.document_type_id
        ).join(
            orm.CustomField,
            orm.CustomField.id == orm.DocumentTypeCustomField.custom_field_id
        )
    )

    return stmt


def select_cf_by_document_id(document_id: uuid.UUID) -> Select:
    """Returns SqlAlchemy selector for document custom fields"""
    stmt = (
        _select_cf()
        .where(
            orm.Document.id == document_id
        )
    )

    return stmt


def select_cf_by_document_type(document_type_id: uuid.UUID) -> Select:
    """Returns SqlAlchemy selector for document custom fields"""
    stmt = (
        _select_cf()
        .where(
            orm.Document.document_type_id == document_type_id
        ).group_by(orm.CustomField.id)
    )

    return stmt


def select_doc_cfv(document_id: uuid.UUID) -> Select:
    """Returns SqlAlchemy selector for document custom field values"""
    cf = select_cf_by_document_id(document_id).subquery("cf")
    cfv = aliased(orm.CustomFieldValue, name="cfv")
    assoc = aliased(orm.DocumentTypeCustomField, name="assoc")
    doc = aliased(orm.Document, name="doc")

    stmt = select(
        doc.id.label("doc_id"),
        doc.document_type_id,
        cf.c.name.label("cf_name"),
        cf.c.extra_data.label("cf_extra_data"),
        cf.c.type.label("cf_type"),
        cf.c.id.label("cf_id"),
        cfv.id.label("cfv_id"),
        case(
            (cf.c.type == 'monetary', func.cast(cfv.value_monetary, VARCHAR)),
            (cf.c.type == 'text', func.cast(cfv.value_text, VARCHAR)),
            (cf.c.type == 'int', func.cast(cfv.value_int, VARCHAR)),
            (cf.c.type == 'float', func.cast(cfv.value_float, VARCHAR)),
            (cf.c.type == 'date', func.substr(func.cast(cfv.value_date, VARCHAR), 0, DATE_LEN)),
            (cf.c.type == 'boolean', func.cast(cfv.value_boolean, VARCHAR)),
            (cf.c.type == 'yearmonth', func.cast(cfv.value_yearmonth, VARCHAR)),
        ).label("cf_value")
    ).select_from(doc).join(
        assoc,
        assoc.document_type_id == doc.document_type_id
    ).join(
        cf,
        cf.c.id == assoc.custom_field_id
    ).join(
        cfv,
        (cfv.field_id == cf.c.id) & (cfv.document_id == document_id),
        isouter=True
    ).where(doc.id == document_id)

    return stmt


def select_doc_type_cfv(document_type_id: uuid.UUID, cf_name: str, cfv_column_name: CFVValueColumn) -> Select:
    """Returns SqlAlchemy selector for document custom field values for
    specific document type and custom field name

    The point of this select is to use it as an extra JOIN for ordering
    by specific custom field column. In order to be able to sort
    by specific custom field column one need to have a "table" (subquery)
    with - doc_id - custom field value - entries i.e. custom
    field value for each document of specific type. Thus, this select
    "returns tuples" for doc-id, cfv for all document of specific
    type (even if that cfv is empty).

    Mind duplicates - this selector (and subquery created from it) must
    NOT return duplicated rows!
    """
    cfv = aliased(orm.CustomFieldValue, name="cfv")
    cf = aliased(orm.CustomField, name="cf")
    assoc = aliased(orm.DocumentTypeCustomField, name="assoc")
    doc = aliased(orm.Document, name="doc")

    stmt = select(
        doc.id.label("doc_id"),
        getattr(cfv, cfv_column_name).label("cf_value")
    ).select_from(doc).join(
        assoc,
        (assoc.document_type_id == doc.document_type_id) & (doc.document_type_id == document_type_id)
    ).join(
        cf,
        (cf.id == assoc.custom_field_id) & (cf.name == cf.name)
    ).join(
        cfv,
        (cfv.document_id == doc.id) & (cfv.field_id == cf.id),
        isouter=True
    ).where(doc.document_type_id == document_type_id, cf.name == cf_name)

    return stmt


def select_docs_by_type(
    document_type_id: uuid.UUID,
    user_id: uuid.UUID,
    limit: int,
    offset: int,
    order_by: str | None = None,
    cfv_column_name: CFVValueColumn | None = None,
    order: OrderEnum = OrderEnum.desc,
) -> Select:
    assoc = aliased(orm.DocumentTypeCustomField, name="assoc")
    doc = aliased(orm.Document, name="doc")
    cf = select_cf_by_document_type(document_type_id).subquery("cf")
    cfv = aliased(orm.CustomFieldValue, name="cfv")

    base_stmt = select(
        doc.title,
        doc.id.label("doc_id"),
        doc.document_type_id.label("document_type_id"),
        cf.c.name.label("cf_name"),
        cf.c.type.label("cf_type"),
        case(
            (cf.c.type == 'monetary', func.cast(cfv.value_monetary, VARCHAR)),
            (cf.c.type == 'text', func.cast(cfv.value_text, VARCHAR)),
            (cf.c.type == 'date',
             func.substr(func.cast(cfv.value_date, VARCHAR), 0, DATE_LEN)),
            (cf.c.type == 'boolean', func.cast(cfv.value_boolean, VARCHAR)),
            (cf.c.type == 'float', func.cast(cfv.value_float, VARCHAR)),
            (cf.c.type == 'int', func.cast(cfv.value_int, VARCHAR)),
            (cf.c.type == 'yearmonth', func.cast(cfv.value_yearmonth, VARCHAR)),
        ).label("cf_value")
    ).select_from(
        doc
    ).join(
        assoc, assoc.document_type_id == doc.document_type_id
    ).join(
        cf, cf.c.id == assoc.custom_field_id
    ).join(
        cfv,
        (cfv.field_id == cf.c.id) & (cfv.document_id == doc.id),
        isouter=True
    )
    if order_by is None:
        stmt = base_stmt.where(
            doc.document_type_id == document_type_id, doc.user_id == user_id
        )
    else:
        orderable_doc = select_doc_type_cfv(
            document_type_id=document_type_id,
            cf_name=order_by,
            cfv_column_name=cfv_column_name
        ).subquery("orderable_doc")

        if order == OrderEnum.asc:
            order_by = orderable_doc.c.cf_value.asc()
        else:
            order_by = orderable_doc.c.cf_value.desc()

        stmt = base_stmt.join(
            orderable_doc, orderable_doc.c.doc_id == doc.id
        ).where(
            doc.document_type_id == document_type_id, doc.user_id == user_id,
        ).order_by(order_by, cf.c.name)

    return stmt.limit(limit).offset(offset)


def select_document_type_cfs(
    document_type_id: uuid.UUID,
    user_id: uuid.UUID,
) -> Select:
    """
    Returns custom fields of specific document type

    Here is an example of what it should return:

            SELECT
                custom_fields.id AS id,
                custom_fields.name AS name,
                custom_fields.type AS type,
                custom_fields.extra_data AS extra_data
            FROM nodes
            JOIN documents doc ON nodes.id = doc.node_id
            JOIN document_types_custom_fields
                ON document_types_custom_fields.document_type_id = doc.document_type_id
            JOIN custom_fields
                ON custom_fields.id = document_types_custom_fields.custom_field_id
            WHERE doc.document_type_id = 'b88b030b-c8ef-472a-a9cf-393251226dbf'
            GROUP BY custom_fields.id

    SELECT generated by SqlAlchemy will have different style for `FROM nodes` part
    but that is not important. Important part are other joins and `GROUP BY` clause
    """
    assoc = aliased(orm.DocumentTypeCustomField, name="assoc")
    doc = aliased(orm.Document, name="doc")
    cf = aliased(orm.CustomField, name="cf")

    stmt = select(
        cf.id,
        cf.name.label("name"),
        cf.type.label("type")
    ).select_from(
        doc
    ).join(
        assoc, assoc.document_type_id == doc.document_type_id
    ).join(
        cf, cf.id == assoc.custom_field_id
    ).where(
        doc.document_type_id == document_type_id,
        doc.user_id == user_id
    ).group_by(cf.id)

    return stmt



def select_docs_by_type_without_ordering(
    document_type_id: uuid.UUID,
    user_id: uuid.UUID,
):
    """
    Should return Sql query apprimately like following one:

        WITH
            cf(id, name, type, extra_data) AS (
                SELECT
                    custom_fields.id AS id, custom_fields.name AS name,
                    custom_fields.type AS type,
                    custom_fields.extra_data AS extra_data
                FROM nodes
                JOIN documents doc ON nodes.id = doc.node_id
                JOIN document_types_custom_fields ON document_types_custom_fields.document_type_id = doc.document_type_id
                JOIN custom_fields ON custom_fields.id = document_types_custom_fields.custom_field_id
                WHERE doc.document_type_id = 'b88b030b-c8ef-472a-a9cf-393251226dbf'
                GROUP BY custom_fields.id
            ),
            all_documents(id, title, ctype, lang, user_id, parent_id, created_at, updated_at,document_type_id) AS (
                SELECT
                        nodes.id AS id,
                        nodes.title AS title,
                        nodes.ctype AS ctype,
                        nodes.lang AS lang,
                        nodes.user_id AS user_id,
                        nodes.parent_id AS parent_id,
                        nodes.created_at AS created_at,
                        nodes.updated_at AS updated_at,
                        documents.document_type_id AS document_type_id
                    FROM nodes JOIN documents ON nodes.id = documents.node_id
            )
        SELECT
            all_documents.id AS doc_id,
            all_documents.title AS doc_title,
            cf.id AS cf_id,
            cf.name AS cf_name,
            cfv.id AS cfv_id,
            CASE
                WHEN (cf.type = 'monetary') THEN CAST(cfv.value_monetary AS VARCHAR)
                WHEN (cf.type = 'text') THEN CAST(cfv.value_text AS VARCHAR)
                WHEN (cf.type = 'date') THEN substr(CAST(cfv.value_date AS VARCHAR), 0, 11)
                WHEN (cf.type = 'boolean') THEN CAST(cfv.value_boolean AS VARCHAR)
                WHEN (cf.type = 'float') THEN CAST(cfv.value_float AS VARCHAR)
                WHEN (cf.type = 'int') THEN CAST(cfv.value_int AS VARCHAR)
                WHEN (cf.type = 'yearmonth') THEN CAST(cfv.value_yearmonth AS VARCHAR)
            END AS cfv_value
        FROM cf
        JOIN all_documents ON all_documents.document_type_id = 'b88b030b-c8ef-472a-a9cf-393251226dbf'
        LEFT JOIN custom_field_values AS cfv
             ON cfv.document_id = all_documents.id  AND cfv.field_id = cf.id
    """
    subq_1 = aliased(select_document_type_cfs(document_type_id, user_id).cte(), name="cf")
    subq_2 = aliased(select(orm.Document).cte(), name="all_documents")
    cfv = aliased(orm.CustomFieldValue, name="cfv")

    stmt = select(
        subq_2.c.title.label('title'),
        subq_2.c.id.label('doc_id'),
        subq_2.c.document_type_id.label('document_type_id'),
        subq_1.c.id.label('cf_id'),
        subq_1.c.name.label('cf_name'),
        subq_1.c.type.label('cf_type'),
        case(
            (subq_1.c.type == 'monetary', func.cast(cfv.value_monetary, VARCHAR)),
            (subq_1.c.type == 'text', func.cast(cfv.value_text, VARCHAR)),
            (subq_1.c.type == 'date',
             func.substr(func.cast(cfv.value_date, VARCHAR), 0, DATE_LEN)),
            (subq_1.c.type == 'boolean', func.cast(cfv.value_boolean, VARCHAR)),
            (subq_1.c.type == 'float', func.cast(cfv.value_float, VARCHAR)),
            (subq_1.c.type == 'int', func.cast(cfv.value_int, VARCHAR)),
            (subq_1.c.type == 'yearmonth', func.cast(cfv.value_yearmonth, VARCHAR)),
        ).label("cf_value")

    ).select_from(subq_1).join(
        subq_2, subq_2.c.document_type_id == document_type_id
    ).join(
        cfv,
        (cfv.field_id == subq_1.c.id) & (cfv.document_id == subq_2.c.id),
        isouter=True
    ).order_by(subq_2.c.id)

    return stmt



def select_docs_by_type2(
    document_type_id: uuid.UUID,
    user_id: uuid.UUID,
    limit: int,
    offset: int,
    order_by: str | None = None,
    cfv_column_name: CFVValueColumn | None = None,
    order: OrderEnum = OrderEnum.desc,
) -> Select:

    stmt = select_docs_by_type_without_ordering(document_type_id, user_id)

    return stmt.limit(limit).offset(offset)
