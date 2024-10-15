import itertools
import uuid
from datetime import datetime
from typing import Optional
from uuid import UUID

from sqlalchemy import delete, insert, select, text, update
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

from .common import get_ancestors

CUSTOM_FIELD_DATA_TYPE_MAP = {
    "string": "text",
    "boolean": "bool",
    "url": "url",
    "date": "date",
    "int": "int",
    "float": "float",
    "monetary": "monetary",
    "select": "select",
}


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
                WHEN(cf.cf_type = 'monetary') THEN cfv.value_monetary
                WHEN(cf.cf_type = 'string') THEN cfv.value_text
                WHEN(cf.cf_type = 'date') THEN cfv.value_date
                WHEN(cf.cf_type = 'boolean') THEN cfv.value_bool
            END AS cf_value
        FROM core_document AS doc
        JOIN core_documenttypecustomfield AS dtcf ON dtcf.document_type_id = doc.document_type_id
        JOIN(
            SELECT
                sub_cf1.id AS cf_id,
                sub_cf1.name AS cf_name,
                sub_cf1.data_type AS cf_type,
                sub_cf1.extra_data AS cf_extra_data
            FROM core_document AS sub_doc1
            JOIN core_documenttypecustomfield AS sub_dtcf1
                ON sub_dtcf1.document_type_id = sub_doc1.document_type_id
            JOIN core_customfield AS sub_cf1
                ON sub_cf1.id = sub_dtcf1.custom_field_id
            WHERE sub_doc1.basetreenode_ptr_id = :document_id
        ) AS cf ON cf.cf_id = dtcf.custom_field_id
        LEFT OUTER JOIN core_customfieldvalue AS cfv
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
    custom_fields: dict,  # if of the document
) -> list[schemas.CFV]:
    """ """
    items = get_doc_cfv(session, document_id=document_id)
    insert_values = []
    update_values = []

    for item in items:
        if item.name not in custom_fields.keys():
            continue

        mapped_type = CUSTOM_FIELD_DATA_TYPE_MAP.get(item.type)
        if item.value is None:
            # prepare insert values
            v = dict(
                id=uuid.uuid4(),
                document_id=item.document_id,
                field_id=item.custom_field_id,
            )
            if item.type == "date":
                v[f"value_{mapped_type}"] = str2date(custom_fields[item.name])
            else:
                v[f"value_{mapped_type}"] = custom_fields[item.name]
            insert_values.append(v)
        else:
            # prepare update values
            v = dict(id=item.custom_field_value_id)
            if item.type == "date":
                v[f"value_{mapped_type}"] = str2date(custom_fields[item.name])
            else:
                v[f"value_{mapped_type}"] = custom_fields[item.name]
            update_values.append(v)

    if len(insert_values) > 0:
        session.execute(insert(CustomFieldValue), insert_values)

    if len(update_values) > 0:
        session.execute(update(CustomFieldValue), update_values)

    session.commit()

    return items


def add_document_custom_field_values(
    session: Session,
    id: UUID,  # id of the document
    custom_fields_add: schemas.DocumentCustomFieldsAdd,
    user_id: UUID,
) -> list[schemas.CustomFieldValue]:
    """
    Adds new `CustomFieldValue` instances

    Returns a list of newly added `CustomFieldValue`
    """
    # fetch doc
    stmt_doc = select(Document).where(Document.id == id, Document.user_id == user_id)
    db_doc = session.scalars(stmt_doc).one()
    # set document type ID to the input value
    db_doc.document_type_id = custom_fields_add.document_type_id
    session.add(db_doc)

    if custom_fields_add.document_type_id is None:
        session.commit()
        return []

    # continue to update document fields
    custom_field_ids = [cf.custom_field_id for cf in custom_fields_add.custom_fields]
    stmt = select(CustomField).where(CustomField.id.in_(custom_field_ids))
    results = session.execute(stmt).all()
    added_items = []

    custom_fields = [schemas.CustomField.model_validate(cf[0]) for cf in results]
    for incoming_cf in custom_fields_add.custom_fields:
        found = next(
            (cf for cf in custom_fields if cf.id == incoming_cf.custom_field_id), None
        )
        if found:
            _dic = {
                "value_text": None,
                "value_bool": None,
                "value_url": None,
                "value_date": None,
                "value_int": None,
                "value_float": None,
                "value_monetary": None,
                "value_select": None,
            }
            attr_name = CUSTOM_FIELD_DATA_TYPE_MAP.get(found.data_type.value, None)
            value = ""
            if attr_name:
                if attr_name == "date":
                    value = str2date(incoming_cf.value)
                else:
                    value = incoming_cf.value
                _dic[f"value_{attr_name}"] = value

            _id = uuid.uuid4()
            cfv = CustomFieldValue(
                id=uuid.uuid4(),
                field_id=found.id,
                document_id=id,
                **_dic,
            )
            session.add(cfv)
            validated_item = schemas.CustomFieldValue(
                id=_id,
                name=found.name,
                data_type=found.data_type,
                extra_data=found.extra_data,
                value=str(value),
                field_id=found.id,
            )
            added_items.append(validated_item)

    session.commit()
    return added_items


def get_document_custom_field_values(
    session: Session,
    id: UUID,
    user_id: UUID,
) -> list[schemas.CustomFieldValue]:
    result = []
    custom_field_ids = []
    stmt_doc = select(Document).where(Document.id == id)
    db_doc = session.scalars(stmt_doc).one()
    if db_doc.document_type:
        custom_field_ids = [cf.id for cf in db_doc.document_type.custom_fields]

    if len(custom_field_ids) == 0:
        return result  # which at this point is []

    stmt = (
        select(CustomFieldValue)
        .join(CustomField)
        .where(
            CustomFieldValue.document_id == id,
            CustomField.id == CustomFieldValue.field_id,
            CustomField.id.in_(custom_field_ids),
        )
    )
    db_results = session.scalars(stmt).all()

    for db_item in db_results:
        if db_item.field.data_type == schemas.CustomFieldType.int:
            value = db_item.value_int
        elif db_item.field.data_type == schemas.CustomFieldType.string:
            value = db_item.value_text
        elif db_item.field.data_type == schemas.CustomFieldType.date:
            value = db_item.value_date
        elif db_item.field.data_type == schemas.CustomFieldType.boolean:
            value = db_item.value_bool
        elif db_item.field.data_type == schemas.CustomFieldType.float:
            value = db_item.value_float
        elif db_item.field.data_type == schemas.CustomFieldType.select:
            value = db_item.value_select
        elif db_item.field.data_type == schemas.CustomFieldType.url:
            value = db_item.value_url
        elif db_item.field.data_type == schemas.CustomFieldType.monetary:
            value = db_item.value_monetary
        else:
            raise ValueError(f"Data type not supported: {db_item.field.data_type}")

        cfv = schemas.CustomFieldValue(
            id=db_item.id,
            name=db_item.field.name,
            data_type=db_item.field.data_type,
            extra_data=db_item.field.extra_data,
            value=str(value),
            field_id=db_item.field_id,
        )
        result.append(cfv)

    return result


def get_docs_by_type(
    session: Session,
    type_id: UUID,
    ancestor_id: UUID,
    user_id: UUID,
) -> list[schemas.DocumentCFV]:
    """
    Returns list of documents + doc CFv for all documents with of given type

    All fetched documents are descendants of `ancestor_id` node.
    """
    stmt = """
        SELECT node.title,
            doc.basetreenode_ptr_id AS doc_id,
            doc.document_type_id,
            cf.cf_id AS cf_id,
            cf.cf_name,
            cf.cf_type AS cf_type,
            cf.cf_extra_data,
            cfv.id AS cfv_id,
            CASE
                WHEN(cf.cf_type = 'monetary') THEN cfv.value_monetary
                WHEN(cf.cf_type = 'string') THEN cfv.value_text
                WHEN(cf.cf_type = 'date') THEN cfv.value_date
                WHEN(cf.cf_type = 'boolean') THEN cfv.value_bool
            END AS cf_value
        FROM core_document AS doc
        JOIN core_basetreenode AS node
          ON node.id == doc.basetreenode_ptr_id
        JOIN core_documenttypecustomfield AS dtcf ON dtcf.document_type_id = doc.document_type_id
        JOIN(
            SELECT
                sub_cf1.id AS cf_id,
                sub_cf1.name AS cf_name,
                sub_cf1.data_type AS cf_type,
                sub_cf1.extra_data AS cf_extra_data
            FROM core_documenttype AS sub_dt1
            JOIN core_documenttypecustomfield AS sub_dtcf1
                ON sub_dtcf1.document_type_id = sub_dt1.id
            JOIN core_customfield AS sub_cf1
                ON sub_cf1.id = sub_dtcf1.custom_field_id
            WHERE sub_dt1.id = :document_type_id
        ) AS cf ON cf.cf_id = dtcf.custom_field_id
        LEFT OUTER JOIN core_customfieldvalue AS cfv
            ON cfv.field_id = cf.cf_id AND cfv.document_id = doc_id
        WHERE node.parent_id = :parent_id
            AND doc.document_type_id = :document_type_id
    """
    str_parent_id = str(ancestor_id).replace("-", "")
    str_type_id = str(type_id).replace("-", "")
    params = {"parent_id": str_parent_id, "document_type_id": str_type_id}
    results = []
    rows = session.execute(text(stmt), params)
    for document_id, group in itertools.groupby(rows, lambda r: r.doc_id):
        items = list(group)
        custom_fields = []

        for item in items:
            if item.cf_type == "date":
                value = str2date(item.cf_value)
            else:
                value = item.cf_value
            custom_fields.append((item.cf_name, value))

        results.append(
            schemas.DocumentCFV(
                id=uuid.UUID(document_id),
                title=items[0].title,
                document_type_id=uuid.UUID(items[0].document_type_id),
                custom_fields=custom_fields,
            )
        )

    return results
