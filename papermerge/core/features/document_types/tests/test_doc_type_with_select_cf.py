"""
Test select custom field with document type and document association.

These tests validate:
1. Creating a select custom field with four options
2. Creating a document type with that custom field
3. Creating a document associated with the document type
4. Setting a valid select value on the document
5. Attempting to set an invalid select value (not from allowed options)
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


async def test_select_field_with_valid_value(
    db_session,
    user,
    make_custom_field_v2,
    make_document
):
    """
    Test setting a valid select value on a document.

    Steps:
    1. Create a select custom field with four status options
    2. Create a document type with that custom field
    3. Create a document with that document type
    4. Set a valid select value
    5. Verify the value was correctly stored
    """
    # Step 1: Create select custom field with four realistic status options
    field = await make_custom_field_v2(
        name="Status",
        type_handler="select",
        config={
            "options": [
                {"value": "draft", "label": "Draft"},
                {"value": "pending_review", "label": "Pending Review"},
                {"value": "approved", "label": "Approved"},
                {"value": "archived", "label": "Archived"}
            ]
        }
    )

    # Step 2: Create document type with the select custom field
    create_dt_data = dt_schema.CreateDocumentType(
        name="Contract",
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
        title="Employment-Contract.pdf",
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

    # Step 4: Set a valid select value
    value_data = cf_schema.SetCustomFieldValue(
        field_id=field.id,
        value="approved"
    )

    cfv = await cf_dbapi.set_custom_field_value(
        db_session,
        doc.id,
        value_data
    )

    # Step 5: Verify the value was correctly stored
    assert cfv.document_id == doc.id
    assert cfv.field_id == field.id
    assert cfv.value.raw == "approved"
    assert cfv.value.sortable == "approved"  # sortable is label.lower()
    assert cfv.value.metadata["label"] == "Approved"
    assert cfv.value_text == "approved"


async def test_select_field_with_invalid_value(
    db_session,
    user,
    make_custom_field_v2,
    make_document
):
    """
    Test that setting an invalid select value raises an error.

    Steps:
    1. Create a select custom field with four status options
    2. Create a document type with that custom field
    3. Create a document with that document type
    4. Attempt to set an invalid value (not from allowed options)
    5. Verify that a ValueError is raised
    """
    # Step 1: Create select custom field with four realistic status options
    field = await make_custom_field_v2(
        name="Status",
        type_handler="select",
        config={
            "options": [
                {"value": "draft", "label": "Draft"},
                {"value": "pending_review", "label": "Pending Review"},
                {"value": "approved", "label": "Approved"},
                {"value": "archived", "label": "Archived"}
            ]
        }
    )

    # Step 2: Create document type with the select custom field
    create_dt_data = dt_schema.CreateDocumentType(
        name="Contract",
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
        title="Employment-Contract.pdf",
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

    # Step 4: Attempt to set an invalid select value
    value_data = cf_schema.SetCustomFieldValue(
        field_id=field.id,
        value="rejected"  # This value is NOT in the allowed options
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
    assert "Must select one of" in str(exc_info.value)
