from core.features.conftest import system_user
from papermerge.core.types import OwnerType
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
        },
        owner_type=OwnerType.USER,
        owner_id=user.id,
    )

    field = await cf_dbapi.create_custom_field(
        db_session,
        data=field_data,
        created_by=user.id
    )

    assert field.name == "Notes"
    assert field.type_handler == "text"

    # Check ownership using new pattern
    assert field.owned_by.id == user.id
    assert field.owned_by.type == "user"
    assert field.owned_by.name == user.username

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
        },
        owner_type=OwnerType.USER,
        owner_id=user.id,
    )

    field = await cf_dbapi.create_custom_field(
        db_session,
        data=field_data,
        created_by=user.id
    )

    assert field.name == "Invoice Total"
    assert field.type_handler == "monetary"
    assert field.config["currency"] == "EUR"
    assert field.config["precision"] == 2


async def test_create_field_for_group(db_session, make_group, system_user):
    """Create custom field owned by a group"""
    group = await make_group("Accounting")

    field_data = cf_schema.CreateCustomField(
        name="Department Code",
        type_handler="text",
        config={},
        owner_type=OwnerType.GROUP,
        owner_id=group.id,
    )

    field = await cf_dbapi.create_custom_field(
        db_session,
        data=field_data,
        created_by=system_user.id
    )

    assert field.name == "Department Code"
    assert field.owned_by.id == group.id
    assert field.owned_by.type is OwnerType.GROUP


async def test_create_date_field(db_session, user):
    """Create date custom field"""
    field_data = cf_schema.CreateCustomField(
        name="Effective Date",
        type_handler="date",
        config={"format": "YYYY-MM-DD"},
        owner_type=OwnerType.USER,
        owner_id=user.id,
    )

    field = await cf_dbapi.create_custom_field(
        db_session,
        data=field_data,
        created_by=user.id
    )

    assert field.type_handler == "date"
    assert field.config.get("format") == "YYYY-MM-DD"



async def test_create_select_field_with_two_options(db_session, user):
    """Create a select custom field with 'free' and 'paid' options"""
    field_data = cf_schema.CreateCustomField(
        name="Subscription",
        type_handler="select",
        config={
            "options": [
                {"value": "free", "label": "Free"},
                {"value": "paid", "label": "Paid"}
            ]
        },
        owner_type=OwnerType.USER,
        owner_id=user.id
    )

    field = await cf_dbapi.create_custom_field(
        db_session,
        data=field_data,
        created_by=user.id
    )

    assert field.name == "Subscription"
    assert field.type_handler == "select"

    # Check ownership
    assert field.owned_by.id == user.id
    assert field.owned_by.type == "user"
    assert field.owned_by.name == user.username

    # Verify config contains the two options
    assert "options" in field.config
    options = field.config["options"]
    assert len(options) == 2

    # Extract option values
    option_values = [opt["value"] for opt in options]
    assert "free" in option_values
    assert "paid" in option_values

    # Extract option labels
    option_labels = [opt["label"] for opt in options]
    assert "Free" in option_labels
    assert "Paid" in option_labels

    # Verify default config values are set
    assert field.config.get("allow_custom") is False
    assert field.config.get("required") is False


async def test_create_multiselect_field_with_two_options(db_session, user):
    """Create a multiselect custom field with 'financial' and 'legal' options"""
    field_data = cf_schema.CreateCustomField(
        name="Categories",
        type_handler="multiselect",
        config={
            "options": [
                {"value": "financial", "label": "Financial"},
                {"value": "legal", "label": "Legal"}
            ]
        },
        owner_type=OwnerType.USER,
        owner_id=user.id
    )

    field = await cf_dbapi.create_custom_field(
        db_session,
        data=field_data,
        created_by=user.id
    )

    assert field.name == "Categories"
    assert field.type_handler == "multiselect"

    # Check ownership
    assert field.owned_by.id == user.id
    assert field.owned_by.type == "user"
    assert field.owned_by.name == user.username

    # Verify config contains the two options
    assert "options" in field.config
    options = field.config["options"]
    assert len(options) == 2

    # Extract option values
    option_values = [opt["value"] for opt in options]
    assert "financial" in option_values
    assert "legal" in option_values

    # Extract option labels
    option_labels = [opt["label"] for opt in options]
    assert "Financial" in option_labels
    assert "Legal" in option_labels

    # Verify default config values specific to multiselect
    assert field.config.get("allow_custom") is False
    assert field.config.get("required") is False
    assert field.config.get("min_selections") is None
    assert field.config.get("max_selections") is None
    assert field.config.get("separator") == ", "
