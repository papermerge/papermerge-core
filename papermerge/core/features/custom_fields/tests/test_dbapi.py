from decimal import Decimal
from datetime import date

import pytest

from papermerge.core.features.custom_fields.db import api as cf_dbapi
from papermerge.core.features.custom_fields import schema as cf_schema


@pytest.mark.asyncio
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



@pytest.mark.asyncio
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

@pytest.mark.asyncio
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


@pytest.mark.asyncio
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


class TestSetCustomFieldValue:
    """Tests for setting custom field values"""

    @pytest.mark.asyncio
    async def test_set_text_value(
        self,
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

    @pytest.mark.asyncio
    async def test_set_numeric_value(
        self,
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

    @pytest.mark.asyncio
    async def test_set_monetary_value(
        self,
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

    @pytest.mark.asyncio
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

    @pytest.mark.asyncio
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

    @pytest.mark.asyncio
    async def test_update_existing_value(
        self,
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


class TestGetCustomFieldValues:
    """Tests for retrieving custom field values"""

    @pytest.mark.asyncio
    async def test_get_values_for_document(
        self,
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

    @pytest.mark.asyncio
    async def test_get_single_value(
        self,
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
        assert retrieved.value["raw"] == 999.99


class TestDeleteCustomFieldValue:
    """Tests for deleting custom field values"""

    @pytest.mark.asyncio
    async def test_delete_value(
        self,
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


class TestComputedColumns:
    """Tests for generated/computed columns"""

    @pytest.mark.asyncio
    async def test_text_computed_column(
        self,
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

    @pytest.mark.asyncio
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

    @pytest.mark.asyncio
    async def test_date_computed_column(
        self,
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

    @pytest.mark.asyncio
    async def test_boolean_computed_column(
        self,
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
