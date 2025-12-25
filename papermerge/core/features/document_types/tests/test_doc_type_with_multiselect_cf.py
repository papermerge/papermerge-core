"""
Test multiselect custom field with document type and document association.

These tests validate:
1. Creating a multiselect custom field with four options
2. Creating a document type with that custom field
3. Creating a document associated with the document type
4. Setting valid multiselect values on the document
5. Attempting to set an invalid multiselect value (not from allowed options)
"""
import uuid

import pytest

from papermerge.core import orm
from papermerge.core.types import OwnerType, NodeResource, Owner
from papermerge.core.features.custom_fields.db import api as cf_dbapi
from papermerge.core.features.custom_fields import schema as cf_schema
from papermerge.core.features.document_types.db import api as dt_dbapi
from papermerge.core.features.document_types import schema as dt_schema
from papermerge.core.features.ownership.db import api as ownership_api


async def test_multiselect_field_with_valid_values(
    db_session,
    user,
    make_custom_field_v2,
    make_document
):
    """
    Test setting valid multiselect values on a document.

    Steps:
    1. Create a multiselect custom field with four department options
    2. Create a document type with that custom field
    3. Create a document with that document type
    4. Set multiple valid values (a document can belong to multiple departments)
    5. Verify the values were correctly stored
    """
    # Step 1: Create multiselect custom field with four realistic department options
    field = await make_custom_field_v2(
        name="Departments",
        type_handler="multiselect",
        config={
            "options": [
                {"value": "hr", "label": "Human Resources"},
                {"value": "finance", "label": "Finance"},
                {"value": "legal", "label": "Legal"},
                {"value": "operations", "label": "Operations"}
            ]
        }
    )

    # Step 2: Create document type with the multiselect custom field
    create_dt_data = dt_schema.CreateDocumentType(
        name="Policy Document",
        custom_field_ids=[field.id],
        owner_type=OwnerType.USER,
        owner_id=user.id
    )
    document_type = await dt_dbapi.create_document_type(
        db_session,
        data=create_dt_data
    )

    # Step 3: Create document with that document type
    doc = orm.Document(
        id=uuid.uuid4(),
        ctype="document",
        title="Employee-Handbook.pdf",
        document_type_id=document_type.id,
        parent_id=user.home_folder_id,
        created_by=user.id,
        updated_by=user.id
    )
    db_session.add(doc)
    await db_session.flush()

    await ownership_api.set_owner(
        session=db_session,
        resource=NodeResource(id=doc.id),
        owner=Owner(owner_type=OwnerType.USER, owner_id=user.id)
    )
    await db_session.commit()

    # Step 4: Set multiple valid values (HR and Legal departments)
    value_data = cf_schema.SetCustomFieldValue(
        field_id=field.id,
        value=["hr", "legal"]
    )

    cfv = await cf_dbapi.set_custom_field_value(
        db_session,
        doc.id,
        value_data
    )

    # Step 5: Verify the values were correctly stored
    assert cfv.document_id == doc.id
    assert cfv.field_id == field.id
    assert set(cfv.value.raw) == {"hr", "legal"}
    assert cfv.value.metadata["count"] == 2
    assert set(cfv.value.metadata["labels"]) == {"Human Resources", "Legal"}


async def test_multiselect_field_with_invalid_value(
    db_session,
    user,
    make_custom_field_v2,
    make_document
):
    """
    Test that setting an invalid multiselect value raises an error.

    Steps:
    1. Create a multiselect custom field with four department options
    2. Create a document type with that custom field
    3. Create a document with that document type
    4. Attempt to set values where one is invalid (not from allowed options)
    5. Verify that a ValueError is raised
    """
    # Step 1: Create multiselect custom field with four realistic department options
    field = await make_custom_field_v2(
        name="Departments",
        type_handler="multiselect",
        config={
            "options": [
                {"value": "hr", "label": "Human Resources"},
                {"value": "finance", "label": "Finance"},
                {"value": "legal", "label": "Legal"},
                {"value": "operations", "label": "Operations"}
            ]
        }
    )

    # Step 2: Create document type with the multiselect custom field
    create_dt_data = dt_schema.CreateDocumentType(
        name="Policy Document",
        custom_field_ids=[field.id],
        owner_type=OwnerType.USER,
        owner_id=user.id
    )
    document_type = await dt_dbapi.create_document_type(
        db_session,
        data=create_dt_data
    )

    # Step 3: Create document with that document type
    doc = orm.Document(
        id=uuid.uuid4(),
        ctype="document",
        title="Employee-Handbook.pdf",
        document_type_id=document_type.id,
        parent_id=user.home_folder_id,
        created_by=user.id,
        updated_by=user.id
    )
    db_session.add(doc)
    await db_session.flush()

    await ownership_api.set_owner(
        session=db_session,
        resource=NodeResource(id=doc.id),
        owner=Owner(owner_type=OwnerType.USER, owner_id=user.id)
    )
    await db_session.commit()

    # Step 4: Attempt to set values with one invalid option
    value_data = cf_schema.SetCustomFieldValue(
        field_id=field.id,
        value=["hr", "marketing"]  # "marketing" is NOT in the allowed options
    )

    # Step 5: Verify that a ValueError is raised
    with pytest.raises(ValueError) as exc_info:
        await cf_dbapi.set_custom_field_value(
            db_session,
            doc.id,
            value_data
        )

    # Verify the error message mentions the validation failure
    assert "Validation failed" in str(exc_info.value)
    assert "Invalid selections" in str(exc_info.value)
    assert "marketing" in str(exc_info.value)
