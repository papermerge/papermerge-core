import uuid
from datetime import datetime
from typing import Optional
from uuid import UUID

from sqlalchemy import and_, case, desc, or_, select
from sqlalchemy.orm import Session, aliased

from papermerge.core import schemas
from papermerge.core.constants import INCOMING_DATE_FORMAT
from papermerge.core.db.models import (
    ColoredTag,
    CustomField,
    CustomFieldValue,
    Document,
    DocumentType,
    DocumentTypeCustomField,
    DocumentVersion,
    Node,
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


def str2date(value: str) -> Optional[datetime.date]:
    """Convert incoming user string to datetime.date"""
    # 10 = 4 Y chars +  1 "-" char + 2 M chars + 1 "-" char + 2 D chars
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


def get_doc_cfv(session: Session, document_id: UUID, cf_names: list[str]):
    """
    Fetch document's custom field values for each CF name, even of CFV is NULL

    Example: Say there is one document with ID=123 and document type Grocery.
    Document type Grocery has 3 custom fields: Shop, Total, Date.

    get_doc_cfv(ID=123) will return one list with 3 items in it:

    1. doc_id=123 cf_name=Shop cf_value=None
    2. doc_id=123 cf_name=Total cf_value=17.29
    3. doc_id=123 cf_name=Date cf_value=None

    Notice that item 1 and 3 have cf_value=None, which indicates
    that there is no value for it in `custom_field_values` table.

    The corresponding Sql query is (just an example):
    ```
    SELECT doc.basetreenode_ptr_id AS 'Doc ID',
      dt.name AS 'Document Type',
      cf.cf_name AS 'Custom Field Name',
      CASE
        WHEN cf.cf_data_type == 'monetary' THEN cf.value_monetary
        WHEN cf.cf_data_type == 'date' THEN cf.value_date
        WHEN cf.cf_data_type == 'string' THEN cf.value_text
      END AS 'CF VALUE',
      cf.cfv_id
    FROM core_document AS doc
    JOIN core_documenttype AS dt ON doc.document_type_id = dt.id
    JOIN core_documenttypecustomfield dtcf ON dtcf.document_type_id = dt.id
    JOIN (
      SELECT sub_cf.id AS cf_id,
        sub_cf.name AS cf_name,
        sub_cf.data_type AS cf_data_type,
        sub_cfv.id AS cfv_id,
        sub_cfv.value_monetary AS value_monetary,
        sub_cfv.value_date AS value_date,
        sub_cfv.value_text AS value_text
      FROM core_customfield sub_cf
      LEFT OUTER JOIN core_customfieldvalue sub_cfv ON sub_cfv.field_id = sub_cf.id
      WHERE (sub_cfv.document_id = 'b0c90f2f7380404c81179903c55f113b' AND sub_cf.name IN ('Shop', 'Total', 'Date') )
      OR (sub_cfv.document_id IS NULL AND sub_cf.name IN ('Shop', 'Total', 'Date'))
    ) cf ON cf.cf_id = dtcf.custom_field_id
    WHERE cf.cf_name in ('Total', 'Shop', 'Date')
      AND doc.basetreenode_ptr_id = 'b0c90f2f7380404c81179903c55f113b';
      ```
    """
    cfv = aliased(CustomFieldValue)
    cf = aliased(CustomField)

    stmt = (
        select(
            cf.id.label("cf_id"),
            cf.name,
            cf.data_type,
            cfv.id.label("cfv_id"),
            cfv.value_monetary,
            cfv.value_text,
            cfv.value_date,
        )
        .select_from(cf)
        .join(cfv, cfv.field_id == cf.id, isouter=True)
        .where(
            or_(
                and_(cfv.document_id == document_id, cf.name.in_(cf_names)),
                and_(cfv.document_id is None, cf.name.in_(cf_names)),
            )
        )
    )
    for row in session.execute(stmt):
        print(row)

    return []


def update_document_custom_fields(
    session: Session,
    document_id: UUID,
    custom_fields: dict,  # if of the document
):
    """ """
    rows = get_doc_cfv(session, document_id=document_id)

    for row in rows:
        # new_value = custom_fields[row.cf_name]
        print(
            f"CFV_ID = {row.cfv_id} | CF_Name = {row.cf_name} | CF_ID = {row.cf_id} | DOC ID = {row.doc_id}"
        )
        # cfv = session.query(CustomFieldValue).where(id == row.cfv_id).one()
        # match row.cf_data_type:
        #    case "monetary":
        #        cfv.value_monetary = new_value
        #    case "string":
        #        cfv.value_text = new_value
        #    case "date":
        #        cfv.value_date = new_value

    # session.commit()


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
                    _dic[f"value_{attr_name}"] = str2date(incoming_cf.value)
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


def get_subq(session: Session, type_id: UUID):
    nd = aliased(Node)
    cfv = aliased(CustomFieldValue)
    cf = aliased(CustomField)
    dtcf = aliased(DocumentTypeCustomField)
    dt = aliased(DocumentType)
    doc = aliased(Document)

    subq = (
        select(
            nd.title.label("title"),
            doc.id.label("doc_id"),
            doc.document_type_id.label("document_type_id"),
        )
        .select_from(doc)
        .join(nd, nd.id == doc.id)
        .join(dt, doc.document_type_id == dt.id)
        .join(dtcf, dtcf.document_type_id == dt.id)
        .join(cf, cf.id == dtcf.custom_field_id)
        .join(cfv, cfv.document_id == doc.id, isouter=True)
        .where(
            dt.id == type_id,
            cf.name == "Total",
            nd.parent_id == UUID("4fdcfbc9-64cb-46d3-bc7e-e1677eaecc70"),
        )
        .order_by(desc(cfv.value_monetary))
        .subquery()
    )

    return subq


def get_documents_by_type(
    session: Session,
    type_id: UUID,
    user_id: UUID,
):
    subq = get_subq(session, type_id=type_id)
    cfv = aliased(CustomFieldValue)
    cf = aliased(CustomField)
    dtcf = aliased(DocumentTypeCustomField)
    dt = aliased(DocumentType)

    stmt = (
        select(
            subq.c.title.label("title"),
            subq.c.doc_id.label("doc_id"),
            cf.name.label("cf_name"),
            case(
                (cf.data_type == "monetary", cfv.value_monetary),
                (cf.data_type == "string", cfv.value_text),
                (cf.data_type == "date", cfv.value_date),
                (cf.data_type == "boolean", cfv.value_bool),
                (cf.data_type == "url", cfv.value_url),
            ).label("cf_value"),
        )
        .select_from(subq)
        .join(dt, subq.c.document_type_id == dt.id)
        .join(dtcf, dtcf.document_type_id == dt.id)
        .join(cf, cf.id == dtcf.custom_field_id)
        .join(cfv, cfv.document_id == subq.c.doc_id, isouter=True)
    )

    documents = {}
    for row in session.execute(stmt):
        if row.doc_id not in documents.keys():
            documents[row.doc_id] = {
                "doc_id": row.doc_id,
                "title": row.title,
                "custom_fields": [(row.cf_name, row.cf_value)],
            }
        else:
            documents[row.doc_id]["custom_fields"].append((row.cf_name, row.cf_value))

    return documents
