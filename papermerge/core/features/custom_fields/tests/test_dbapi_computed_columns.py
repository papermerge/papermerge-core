from decimal import Decimal
from datetime import date


async def test_text_computed_column(
    db_session,
    user,
    make_document,
    make_custom_field_v2,
    make_custom_field_value
):
    """Verify value_text is computed correctly"""
    field = await make_custom_field_v2(name="Name", type_handler="text")
    doc = await make_document("Doc.pdf", parent=user.home_folder, user=user)

    cfv = await make_custom_field_value(doc.id, field.id, "UPPERCASE TEXT")

    # value_text should be lowercase (from sortable)
    assert cfv.value_text == "uppercase text"


async def test_numeric_computed_column(
    self,
    db_session,
    user,
    make_document,
    make_custom_field_v2,
    make_custom_field_value
):
    """Verify value_numeric is computed correctly"""
    field = await make_custom_field_v2(name="Amount", type_handler="number")
    doc = await make_document("Doc.pdf", parent=user.home_folder, user=user)

    cfv = await make_custom_field_value(doc.id, field.id, 1234.567890)

    # Should be stored as NUMERIC with 6 decimal places
    assert isinstance(cfv.value_numeric, Decimal)
    assert cfv.value_numeric == Decimal("1234.567890")


async def test_date_computed_column(
    db_session,
    user,
    make_document,
    make_custom_field_v2,
    make_custom_field_value
):
    """Verify value_date is computed correctly"""
    field = await make_custom_field_v2(name="Date", type_handler="date")
    doc = await make_document("Doc.pdf", parent=user.home_folder, user=user)

    test_date = date(2024, 6, 15)
    cfv = await make_custom_field_value(doc.id, field.id, test_date)

    # Should be extracted as DATE type
    assert isinstance(cfv.value_date, date)
    assert cfv.value_date == test_date


async def test_boolean_computed_column(

    db_session,
    user,
    make_document,
    make_custom_field_v2,
    make_custom_field_value
):
    """Verify value_boolean is computed correctly"""
    field = await make_custom_field_v2(name="Active", type_handler="boolean")
    doc = await make_document("Doc.pdf", parent=user.home_folder, user=user)

    cfv = await make_custom_field_value(doc.id, field.id, False)

    # Should be extracted as boolean
    assert isinstance(cfv.value_boolean, bool)
    assert cfv.value_boolean is False
