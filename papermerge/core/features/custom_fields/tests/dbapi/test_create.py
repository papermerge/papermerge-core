from papermerge.core.features.custom_fields.db import api as cf_dbapi
from papermerge.core.features.custom_fields import schema as cf_schema


async def test_create_text_field(db_session, user):
    """Create a simple text custom field"""
    field_data = cf_schema.CreateCustomField(
        name="Notes",
        type_handler="text",
        config={
            "min_length": 0,
            "max_length": 100,
            "multiline": False
        }
    )

    field = await cf_dbapi.create_custom_field(
        db_session,
        data=field_data,
        user_id=user.id
    )

    assert field.name == "Notes"
    assert field.type_handler == "text"
    assert field.user_id == user.id
    assert field.group_id is None
    assert field.config == {
        "min_length": 0,
        "max_length": 100,
        "multiline": False,
        "pattern": None,
        "pattern_error": None,
        "required": False
    }



async def test_create_monetary_field_with_config(db_session, user):
    """Create monetary field with currency config"""
    field_data = cf_schema.CreateCustomField(
        name="Invoice Total",
        type_handler="monetary",
        config={
            "currency": "EUR",
            "precision": 2
        }
    )

    field = await cf_dbapi.create_custom_field(
        db_session,
        data=field_data,
        user_id=user.id
    )

    assert field.name == "Invoice Total"
    assert field.type_handler == "monetary"
    assert field.config["currency"] == "EUR"
    assert field.config["precision"] == 2


async def test_create_field_for_group(db_session, make_group):
    """Create custom field owned by a group"""
    group = await make_group("Accounting")

    field_data = cf_schema.CreateCustomField(
        name="Department Code",
        type_handler="text",
        config={}
    )

    field = await cf_dbapi.create_custom_field(
        db_session,
        data=field_data,
        group_id=group.id
    )

    assert field.name == "Department Code"
    assert field.group_id == group.id
    assert field.user_id is None


async def test_create_date_field(db_session, user):
    """Create date custom field"""
    field_data = cf_schema.CreateCustomField(
        name="Effective Date",
        type_handler="date",
        config={"format": "YYYY-MM-DD"}
    )

    field = await cf_dbapi.create_custom_field(
        db_session,
        data=field_data,
        user_id=user.id
    )

    assert field.type_handler == "date"
    assert field.config.get("format") == "YYYY-MM-DD"
