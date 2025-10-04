from papermerge.core.features.custom_fields.db import api as cf_dbapi



async def test_get_values_for_document(
    db_session,
    user,
    make_document,
    make_custom_field_v2,
    make_custom_field_value
):
    """Get all custom field values for a document"""
    # Create fields
    field1 = await make_custom_field_v2(name="Field 1", type_handler="text")
    field2 = await make_custom_field_v2(name="Field 2", type_handler="number")

    # Create document
    doc = await make_document(
        title="Test.pdf",
        parent=user.home_folder,
        user=user
    )

    # Set values
    await make_custom_field_value(doc.id, field1.id, "Value 1")
    await make_custom_field_value(doc.id, field2.id, 123.45)

    # Get all values
    values = await cf_dbapi.get_custom_field_values(
        db_session,
        document_id=doc.id
    )

    assert len(values) == 2
    assert any(v.field_id == field1.id for v in values)
    assert any(v.field_id == field2.id for v in values)


async def test_get_single_value(
    db_session,
    user,
    make_document,
    make_custom_field_v2,
    make_custom_field_value
):
    """Get a specific custom field value"""
    field = await make_custom_field_v2(name="Total", type_handler="monetary")

    doc = await make_document(
        title="Invoice.pdf",
        parent=user.home_folder,
        user=user
    )

    cfv = await make_custom_field_value(doc.id, field.id, 999.99)

    # Get specific value
    retrieved = await cf_dbapi.get_custom_field_value(
        db_session,
        document_id=doc.id,
        field_id=field.id
    )

    assert retrieved.id == cfv.id
    assert retrieved.value.raw == 999.99
