import uuid

from sqlalchemy import select, Select, case, func, VARCHAR

from papermerge.core import orm

def select_doc_cf(document_id: uuid.UUID) -> Select:
    """Returns SqlAlchemy selector for document custom fields"""
    stmt = (
        select(
            orm.CustomField.id,
            orm.CustomField.name,
            orm.CustomField.type,
            orm.CustomField.extra_data)
        .select_from(orm.Document)
        .join(orm.DocumentTypeCustomField, orm.DocumentTypeCustomField.document_type_id == orm.Document.document_type_id)
        .join(orm.CustomField, orm.CustomField.id == orm.DocumentTypeCustomField.custom_field_id)
        .where(orm.Document.id == document_id)
    )

    return stmt


def select_doc_cfv(document_id: uuid.UUID) -> Select:
    """Returns SqlAlchemy selector for document custom field values"""
    cf = select_doc_cf(document_id).subquery("cf")
    stmt = select(
        orm.Document.id.label("doc_id"),
        orm.Document.document_type_id,
        cf.c.name.label("cf_name"),
        cf.c.extra_data.label("cf_extra_data"),
        cf.c.type.label("cf_type"),
        cf.c.id.label("cf_id"),
        orm.CustomFieldValue.id.label("cfv_id"),
        case(
            (cf.c.type == 'monetary', func.cast(orm.CustomFieldValue.value_monetary, VARCHAR)),
            (cf.c.type == 'text', func.cast(orm.CustomFieldValue.value_text, VARCHAR)),
            (cf.c.type == 'date', func.substr(func.cast(orm.CustomFieldValue.value_date, VARCHAR), 0, 11)),
            (cf.c.type == 'boolean', func.cast(orm.CustomFieldValue.value_boolean, VARCHAR)),
        ).label("cf_value")
    ).select_from(orm.Document).join(
        orm.DocumentTypeCustomField,
        orm.DocumentTypeCustomField.document_type_id == orm.Document.document_type_id
    ).join(
        cf,
        cf.c.id == orm.DocumentTypeCustomField.custom_field_id
    ).join(
        orm.CustomFieldValue,
        orm.CustomFieldValue.field_id == cf.c.id and orm.CustomFieldValue.document_id == document_id,
        isouter=True
    )

    return stmt
