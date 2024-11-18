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
            (cf.c.type == 'date', func.substr(func.cast(cfv.value_date, VARCHAR), 0, DATE_LEN)),
            (cf.c.type == 'boolean', func.cast(cfv.value_boolean, VARCHAR)),
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
