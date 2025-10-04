from papermerge.core.features.custom_fields.db import api as cf_dbapi


async def test_delete_value(
    db_session,
    user,
    make_document,
    make_custom_field_v2,
    make_custom_field_value
):
    """Delete a custom field value"""
    field = await make_custom_field_v2(name="Notes", type_handler="text")

    doc = await make_document(
        title="Doc.pdf",
        parent=user.home_folder,
        user=user
    )

    cfv = await make_custom_field_value(doc.id, field.id, "Some notes")

    # Delete value
    await cf_dbapi.delete_custom_field_value(
        db_session,
        document_id=doc.id,
        field_id=field.id
    )

    # Verify deleted
    retrieved = await cf_dbapi.get_custom_field_value(
        db_session,
        document_id=doc.id,
        field_id=field.id
    )

    assert retrieved is None
