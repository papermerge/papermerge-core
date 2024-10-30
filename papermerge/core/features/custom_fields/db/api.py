import logging
import uuid

from sqlalchemy import insert, select, text, update
from sqlalchemy.orm import Session

from papermerge.core.features.custom_fields import schema
from papermerge.core.features.custom_fields.db import orm
from papermerge.core.utils.misc import str2date

logger = logging.getLogger(__name__)


def get_custom_fields(session: Session) -> list[schema.CustomField]:
    stmt = select(orm.CustomField)
    db_items = session.scalars(stmt).all()
    result = [schema.CustomField.model_validate(db_item) for db_item in db_items]

    return result


def create_custom_field(
    session: Session,
    name: str,
    type: schema.CustomFieldType,
    user_id: uuid.UUID,
    extra_data: str | None = None,
) -> schema.CustomField:
    cfield = orm.CustomField(
        id=uuid.uuid4(),
        name=name,
        type=type,
        extra_data=extra_data,
        user_id=user_id,
    )
    session.add(cfield)
    session.commit()

    result = schema.CustomField.model_validate(cfield)
    return result


def get_custom_field(
    session: Session, custom_field_id: uuid.UUID
) -> schema.CustomField:
    stmt = select(orm.CustomField).where(orm.CustomField.id == custom_field_id)
    db_item = session.scalars(stmt).unique().one()
    result = schema.CustomField.model_validate(db_item)
    return result


def delete_custom_field(session: Session, custom_field_id: uuid.UUID):
    stmt = select(orm.CustomField).where(orm.CustomField.id == custom_field_id)
    cfield = session.execute(stmt).scalars().one()
    session.delete(cfield)
    session.commit()


def update_custom_field(
    session: Session, custom_field_id: uuid.UUID, attrs: schema.UpdateCustomField
) -> schema.CustomField:
    stmt = select(orm.CustomField).where(orm.CustomField.id == custom_field_id)
    cfield = session.execute(stmt).scalars().one()
    session.add(cfield)

    if attrs.name:
        cfield.name = attrs.name

    if attrs.type:
        cfield.type = attrs.type

    if attrs.extra_data:
        cfield.extra_data = attrs.extra_data

    session.commit()
    result = schema.CustomField.model_validate(cfield)

    return result


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
        session.execute(insert(orm.CustomFieldValue), insert_values)

    if len(update_values) > 0:
        session.execute(update(orm.CustomFieldValue), update_values)

    session.commit()

    return items
