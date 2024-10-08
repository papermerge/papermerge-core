import uuid
from datetime import datetime
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from papermerge.core import schemas
from papermerge.core.db.models import (
    ColoredTag,
    CustomField,
    CustomFieldValue,
    Document,
    DocumentVersion,
    Page,
)

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


def update_document_custom_field_values(
    session: Session,
    id: UUID,  # id of the document
    custom_fields_update: schemas.DocumentCustomFieldsUpdate,
    user_id: UUID,
) -> list[schemas.CustomFieldValue]:
    """
    If document_type_id is None, will just set document's `document_type_id`
    field to None and return an empty list.

    If `document_type_id` is not empty  - updates already existing
    `CustomFieldValue` instances and returns a list of updated `CustomFieldValue`
    """
    # fetch doc
    stmt_doc = select(Document).where(Document.id == id, Document.user_id == user_id)
    db_doc = session.scalars(stmt_doc).one()
    # set document type ID to the input value
    db_doc.document_type_id = custom_fields_update.document_type_id
    session.add(db_doc)
    if custom_fields_update.document_type_id is None:
        session.commit()
        return []

    updated_db_items = []

    field_value_ids = [
        cf.custom_field_value_id for cf in custom_fields_update.custom_fields
    ]
    # fetch existing `CustomFieldValue` instances
    stmt = select(CustomFieldValue).where(
        CustomFieldValue.id.in_(field_value_ids),
        CustomFieldValue.document_id == id,
    )
    db_field_values = session.scalars(stmt).all()
    for db_field_value in db_field_values:
        incoming_cf = None
        # for each DB item, find corresponding incoming values (i.e. newly provided by user)
        for incoming in custom_fields_update.custom_fields:
            if incoming.custom_field_value_id == db_field_value.id:
                incoming_cf = incoming

        if incoming_cf:
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
            attr_name = CUSTOM_FIELD_DATA_TYPE_MAP.get(
                db_field_value.field.data_type, None
            )
            if attr_name:
                if attr_name == "date":
                    _dic[f"value_{attr_name}"] = datetime.strptime(
                        incoming_cf.value, "%d.%m.%Y"
                    )
                else:
                    _dic[f"value_{attr_name}"] = incoming_cf.value

            db_field_value.value_text = _dic["value_text"]
            db_field_value.value_bool = _dic["value_bool"]
            db_field_value.value_url = _dic["value_url"]
            db_field_value.value_date = _dic["value_date"]
            db_field_value.value_int = _dic["value_int"]
            db_field_value.value_float = _dic["value_float"]
            db_field_value.value_monetary = _dic["value_monetary"]
            db_field_value.value_select = _dic["value_select"]
            updated_db_items.append(db_field_value)
            session.add(db_field_value)

    result = [
        schemas.CustomFieldValue(
            id=db_item.id,
            name=db_item.field.name,
            data_type=db_item.field.data_type,
            extra_data=db_item.field.extra_data,
            field_id=db_item.field.id,
            value=str(getattr(db_item, f"value_{db_item.field.data_type}", "")),
        )
        for db_item in updated_db_items
    ]

    session.commit()
    return result


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
                    value = datetime.strptime(incoming_cf.value, "%d.%m.%Y")
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
