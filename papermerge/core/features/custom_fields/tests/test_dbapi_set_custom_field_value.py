from decimal import Decimal
from datetime import date

from papermerge.core.features.custom_fields.db import api as cf_dbapi
from papermerge.core.features.custom_fields import schema as cf_schema


async def test_set_text_value(
    db_session,
    user,
    make_document,
    make_custom_field_v2
):
    """Set a text value on a document"""
    # Create field
    field = await make_custom_field_v2(
        name="Shop Name",
        type_handler="text"
    )

    # Create document
    doc = await make_document(
        title="Receipt.pdf",
        parent=user.home_folder,
        user=user
    )

    # Set value
    value_data = cf_schema.SetCustomFieldValue(
        field_id=field.id,
        value="REWE Supermarket"
    )

    cfv = await cf_dbapi.set_custom_field_value(
        db_session,
        doc.id,
        value_data
    )

    assert cfv.document_id == doc.id
    assert cfv.field_id == field.id
    assert cfv.value["raw"] == "REWE Supermarket"
    assert cfv.value["sortable"] == "rewe supermarket"
    assert cfv.value_text == "rewe supermarket"


async def test_set_numeric_value(
    db_session,
    user,
    make_document,
    make_custom_field_v2
):
    """Set a numeric value"""
    field = await make_custom_field_v2(
        name="Total",
        type_handler="number"
    )

    doc = await make_document(
        title="Invoice.pdf",
        parent=user.home_folder,
        user=user
    )

    value_data = cf_schema.SetCustomFieldValue(
        field_id=field.id,
        value=1234.56
    )

    cfv = await cf_dbapi.set_custom_field_value(
        db_session,
        doc.id,
        value_data
    )

    assert cfv.value["raw"] == 1234.56
    assert cfv.value_numeric == Decimal("1234.56")


async def test_set_monetary_value(
    db_session,
    user,
    make_document,
    make_custom_field_v2
):
    """Set a monetary value with currency"""
    field = await make_custom_field_v2(
        name="Price",
        type_handler="monetary",
        config={"currency": "EUR", "precision": 2}
    )

    doc = await make_document(
        title="Invoice.pdf",
        parent=user.home_folder,
        user=user
    )

    value_data = cf_schema.SetCustomFieldValue(
        field_id=field.id,
        value=99.99
    )

    cfv = await cf_dbapi.set_custom_field_value(
        db_session,
        doc.id,
        value_data
    )

    assert cfv.value["raw"] == 99.99
    assert cfv.value["metadata"]["currency"] == "EUR"
    assert cfv.value_numeric == Decimal("99.99")


async def test_set_date_value(
    self,
    db_session,
    user,
    make_document,
    make_custom_field_v2
):
    """Set a date value"""
    field = await make_custom_field_v2(
        name="Effective Date",
        type_handler="date"
    )

    doc = await make_document(
        title="Contract.pdf",
        parent=user.home_folder,
        user=user
    )

    test_date = date(2024, 12, 25)
    value_data = cf_schema.SetCustomFieldValue(
        field_id=field.id,
        value=test_date
    )

    cfv = await cf_dbapi.set_custom_field_value(
        db_session,
        doc.id,
        value_data
    )

    assert cfv.value["raw"] == "2024-12-25"
    assert cfv.value_date == test_date


async def test_set_boolean_value(
    self,
    db_session,
    user,
    make_document,
    make_custom_field_v2
):
    """Set a boolean value"""
    field = await make_custom_field_v2(
        name="Is Paid",
        type_handler="boolean"
    )

    doc = await make_document(
        title="Invoice.pdf",
        parent=user.home_folder,
        user=user
    )

    value_data = cf_schema.SetCustomFieldValue(
        field_id=field.id,
        value=True
    )

    cfv = await cf_dbapi.set_custom_field_value(
        db_session,
        doc.id,
        value_data
    )

    assert cfv.value["raw"] is True
    assert cfv.value_boolean is True


async def test_update_existing_value(
    db_session,
    user,
    make_document,
    make_custom_field_v2
):
    """Update an existing custom field value"""
    field = await make_custom_field_v2(
        name="Status",
        type_handler="text"
    )

    doc = await make_document(
        title="Document.pdf",
        parent=user.home_folder,
        user=user
    )

    # Set initial value
    value_data_1 = cf_schema.SetCustomFieldValue(
        field_id=field.id,
        value="Draft"
    )
    cfv1 = await cf_dbapi.set_custom_field_value(
        db_session,
        doc.id,
        value_data_1
    )

    # Update value
    value_data_2 = cf_schema.SetCustomFieldValue(
        field_id=field.id,
        value="Published"
    )
    cfv2 = await cf_dbapi.set_custom_field_value(
        db_session,
        doc.id,
        value_data_2
    )

    # Should be same record, updated
    assert cfv1.id == cfv2.id
    assert cfv2.value["raw"] == "Published"
    assert cfv2.value_text == "published"
