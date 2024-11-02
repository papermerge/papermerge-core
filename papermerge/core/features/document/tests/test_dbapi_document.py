from datetime import date as Date

import pytest
from sqlalchemy import func, select

from papermerge.core.db.engine import Session
from papermerge.core.features.custom_fields.db import orm as cf_orm
from papermerge.core.features.document import schema
from papermerge.core.features.document.db import api as dbapi
from papermerge.core.features.document.db import orm as docs_orm


def test_get_doc_cfv_only_empty_values(db_session: Session, make_document_receipt):
    """
    In this scenario we have one document of type "Groceries" i.e. a receipt.
    Groceries document type has following custom fields:
        - Effective Date (date)
        - Total (monetary)
        - Shop (string)

    `db.get_doc_cfv` method should return 3 items (each corresponding
    to one custom field) with all values (i.e. custom field values, in short cfv)
    set to None. In other words, document custom fields are returned in
    regardless if custom field has set a value or no
    """
    receipt = make_document_receipt(title="receipt-1.pdf")
    items: list[schema.CFV] = dbapi.get_doc_cfv(db_session, document_id=receipt.id)
    assert len(items) == 3
    # with just value set to None it is ambiguous:
    # was value was set to None or was value not set at all ?
    assert items[0].value is None
    # when `custom_field_value_id` is None => value was not set yet
    assert items[0].custom_field_value_id is None
    assert items[1].value is None
    assert items[1].custom_field_value_id is None
    assert items[2].value is None
    assert items[2].custom_field_value_id is None


@pytest.mark.parametrize(
    "effective_date_input",
    ["2024-10-28", "2024-10-28 00:00:00", "2024-10-28 00", "2024-10-28 anything here"],
)
def test_document_add_valid_date_cfv(
    effective_date_input,
    db_session: Session,
    make_document_receipt,
):
    """
    Custom field of type `date` is set to string "2024-10-28"
    """
    receipt = make_document_receipt(title="receipt-1.pdf")
    # key = custom field name
    # value = custom field value
    cf = {"EffectiveDate": effective_date_input}

    dbapi.update_doc_cfv(db_session, document_id=receipt.id, custom_fields=cf)

    items: list[schema.CFV] = dbapi.get_doc_cfv(db_session, document_id=receipt.id)
    eff_date_cf = next(item for item in items if item.name == "EffectiveDate")

    assert eff_date_cf.value == Date(2024, 10, 28)


def test_document_update_custom_field_of_type_date(
    db_session: Session,
    make_document_receipt,
):
    receipt = make_document_receipt(title="receipt-1.pdf")

    # add some value (for first time)
    dbapi.update_doc_cfv(
        db_session,
        document_id=receipt.id,
        custom_fields={"EffectiveDate": "2024-09-26"},
    )

    # update existing value
    dbapi.update_doc_cfv(
        db_session,
        document_id=receipt.id,
        custom_fields={"EffectiveDate": "2024-09-27"},
    )

    items: list[schema.CFV] = dbapi.get_doc_cfv(db_session, document_id=receipt.id)
    eff_date_cf = next(item for item in items if item.name == "EffectiveDate")

    # notice it is 27, not 26
    assert eff_date_cf.value == Date(2024, 9, 27)


def test_document_add_multiple_CFVs(
    db_session: Session,
    make_document_receipt,
):
    """
    In this scenario we pass multiple custom field values to
    `db.update_doc_cfv` function
    Initial document does NOT have custom field values before the update.
    """
    receipt = make_document_receipt(title="receipt-1.pdf")

    # pass 3 custom field values in one shot
    cf = {"EffectiveDate": "2024-09-26", "Shop": "Aldi", "Total": "32.97"}
    dbapi.update_doc_cfv(
        db_session,
        document_id=receipt.id,
        custom_fields=cf,
    )

    items: list[schema.CFV] = dbapi.get_doc_cfv(db_session, document_id=receipt.id)
    eff_date_cf = next(item for item in items if item.name == "EffectiveDate")
    shop_cf = next(item for item in items if item.name == "Shop")
    total_cf = next(item for item in items if item.name == "Total")

    assert eff_date_cf.value == Date(2024, 9, 26)
    assert shop_cf.value == "Aldi"
    assert total_cf.value == 32.97


def test_document_update_multiple_CFVs(
    db_session: Session,
    make_document_receipt,
):
    """
    In this scenario we pass multiple custom field values to
    `db.update_doc_cfv` function.
    Initial document does have custom field values before the update.
    """
    receipt = make_document_receipt(title="receipt-1.pdf")

    # set initial CFVs
    cf = {"EffectiveDate": "2024-09-26", "Shop": "Aldi", "Total": "32.97"}
    dbapi.update_doc_cfv(
        db_session,
        document_id=receipt.id,
        custom_fields=cf,
    )

    # Update all existing CFVs in one shot
    cf = {"EffectiveDate": "2024-09-27", "Shop": "Lidl", "Total": "40.22"}
    dbapi.update_doc_cfv(
        db_session,
        document_id=receipt.id,
        custom_fields=cf,
    )

    items: list[schema.CFV] = dbapi.get_doc_cfv(db_session, document_id=receipt.id)
    eff_date_cf = next(item for item in items if item.name == "EffectiveDate")
    shop_cf = next(item for item in items if item.name == "Shop")
    total_cf = next(item for item in items if item.name == "Total")

    assert eff_date_cf.value == Date(2024, 9, 27)
    assert shop_cf.value == "Lidl"
    assert total_cf.value == 40.22


def test_document_without_cfv_update_document_type_to_none(
    db_session: Session,
    make_document_receipt,
):
    """
    In this scenario we have a document of specific document type (groceries)

    If document's type is cleared (set to None) then no more custom
    fields will be returned for this document.

    In this scenario document does not have associated CFV
    """
    receipt = make_document_receipt(title="receipt-1.pdf")
    items = dbapi.get_doc_cfv(db_session, document_id=receipt.id)
    # document is of type Groceries, thus there are custom fields
    assert len(items) == 3

    dbapi.update_doc_type(db_session, document_id=receipt.id, document_type_id=None)

    items = dbapi.get_doc_cfv(db_session, document_id=receipt.id)
    # document does not have any type associated, thus no custom fields
    assert len(items) == 0

    stmt = select(func.count(cf_orm.CustomFieldValue.id)).where(
        cf_orm.CustomFieldValue.document_id == receipt.id
    )
    assert db_session.execute(stmt).scalar() == 0


def test_document_with_cfv_update_document_type_to_none(
    db_session: Session,
    make_document_receipt,
):
    """
    In this scenario we have a document of specific document type (groceries)

    If document's type is cleared (set to None) then no more custom
    fields will be returned for this document.

    In this scenario document has associated CFV
    """
    receipt = make_document_receipt(title="receipt-1.pdf")
    # add some cfv
    dbapi.update_doc_cfv(
        db_session,
        document_id=receipt.id,
        custom_fields={"EffectiveDate": "2024-09-27"},
    )
    items = dbapi.get_doc_cfv(db_session, document_id=receipt.id)
    # document is of type Groceries, thus there are custom fields
    assert len(items) == 3
    # there is exactly one cfv: one value for EffectiveDate
    stmt = select(func.count(cf_orm.CustomFieldValue.id)).where(
        cf_orm.CustomFieldValue.document_id == receipt.id
    )
    assert db_session.execute(stmt).scalar() == 1

    # set document type to None
    dbapi.update_doc_type(db_session, document_id=receipt.id, document_type_id=None)

    items = dbapi.get_doc_cfv(db_session, document_id=receipt.id)
    # document does not have any type associated, thus no custom fields
    assert len(items) == 0

    stmt = select(func.count(cf_orm.CustomFieldValue.id)).where(
        cf_orm.CustomFieldValue.document_id == receipt.id
    )

    # no more associated CFVs
    assert db_session.execute(stmt).scalar() == 0


def test_document_update_string_custom_field_value_multiple_times(
    db_session: Session,
    make_document_receipt,
):
    """
    Every time custom field value is updated the retrieved value
    is the latest one
    """
    receipt = make_document_receipt(title="receipt-1.pdf")

    # add some value (for first time)
    dbapi.update_doc_cfv(
        db_session,
        document_id=receipt.id,
        custom_fields={"Shop": "lidl"},
    )

    # update existing value
    dbapi.update_doc_cfv(
        db_session,
        document_id=receipt.id,
        custom_fields={"Shop": "rewe"},
    )

    items: list[schema.CFV] = dbapi.get_doc_cfv(db_session, document_id=receipt.id)
    shop_cf = next(item for item in items if item.name == "Shop")

    assert shop_cf.value == "rewe"


def test_get_docs_by_type_basic(db_session: Session, make_document_receipt):
    """
    `db.get_docs_by_type` must return all documents of specific type
    regardless if they (documents) have or no associated custom field values.

    In this scenario all returned documents must have custom fields with empty
    values.
    And number of returned items must be equal to the number of documents
    of type "Grocery"
    """
    doc_1 = make_document_receipt(title="receipt_1.pdf")
    make_document_receipt(title="receipt_2.pdf")
    user_id = doc_1.user.id
    type_id = doc_1.document_type.id

    items: list[schema.DocumentCFV] = dbapi.get_docs_by_type(
        db_session, type_id=type_id, user_id=user_id
    )

    assert len(items) == 2

    for i in range(0, 2):
        cf = dict([(y[0], y[1]) for y in items[i].custom_fields])
        assert cf["EffectiveDate"] is None
        assert cf["Shop"] is None
        assert cf["Total"] is None


def test_get_docs_by_type_one_doc_with_nonempty_cfv(
    db_session: Session, make_document_receipt
):
    """
    `db.get_docs_by_type` must return all documents of specific type
    regardless if they (documents) have or no associated custom field values.

    In this scenario one of the returned documents has all CFVs set to
    non empty values and the other one - to all values empty
    """
    doc_1 = make_document_receipt(title="receipt_1.pdf")
    make_document_receipt(title="receipt_2.pdf")
    user_id = doc_1.user.id
    type_id = doc_1.document_type.id

    # update all CFV of receipt_1.pdf to non-empty values
    dbapi.update_doc_cfv(
        db_session,
        document_id=doc_1.id,
        custom_fields={"Shop": "rewe", "EffectiveDate": "2024-10-15", "Total": "15.63"},
    )

    items: list[schema.DocumentCFV] = dbapi.get_docs_by_type(
        db_session, type_id=type_id, user_id=user_id
    )

    assert len(items) == 2

    # returned items are not sorted i.e. may be in any order
    for i in range(0, 2):
        cf = dict([(y[0], y[1]) for y in items[i].custom_fields])
        if items[i].id == doc_1.id:
            #  receipt_1.pdf has all cf set correctly
            assert cf["EffectiveDate"] == Date(2024, 10, 15)
            assert cf["Shop"] == "rewe"
            assert cf["Total"] == 15.63
        else:
            # receipt_2.pdf has all cf set to None
            assert cf["EffectiveDate"] is None
            assert cf["Shop"] is None
            assert cf["Total"] is None


def test_document_version_dump(db_session, make_document, user):
    doc: schema.Document = make_document(
        title="some doc", user=user, parent=user.home_folder
    )
    # initially document has only one version
    assert len(doc.versions) == 1

    dbapi.version_bump(db_session, doc_id=doc.id, user_id=user.id)

    new_doc = db_session.get(docs_orm.Document, doc.id)

    # now document has two versions
    assert len(new_doc.versions) == 2
    assert new_doc.versions[0].number == 1
    assert new_doc.versions[1].number == 2
