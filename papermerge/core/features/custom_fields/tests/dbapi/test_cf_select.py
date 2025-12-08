import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from papermerge.core import orm, types
from papermerge.core.features.custom_fields.db import api as cf_dbapi
from papermerge.core.features.custom_fields import schema as cf_schema
from papermerge.core.features.document_types.db import api as dt_dbapi
from papermerge.core.features.document_types import schema as dt_schema
from papermerge.core.features.ownership.db import api as ownership_api
from papermerge.core.features.custom_fields import types as cf_types


async def test_count_referenced_option_of_cf_type_select(
    db_session: AsyncSession,
    user,
    make_custom_field_select,
):
    """
    Count documents that reference specific value of
    Custom Field of type "select"

    Setup:
    - Create custom field of type "select" named "Priority" with options:
        * high
        * medium
        * low
    - Create document type with the field
    - Create documents with cf value set to "high" and "medium
    """
    owner = types.Owner.create_from(user_id=user.id)
    field = await make_custom_field_select(
        name="Priority",
        options=[
            cf_types.opt(value="high", label="High"),
            cf_types.opt(value="medium", label="Medium"),
            cf_types.opt(value="low", label="Low")
        ],
        owner=owner
    )

    # Create document type
    dt_data = dt_schema.CreateDocumentType(
        name="Task",
        custom_field_ids=[field.id],
        owner_type=types.OwnerType.USER,
        owner_id=user.id
    )
    doc_type = await dt_dbapi.create_document_type(db_session, data=dt_data)

    # Create document
    doc1 = orm.Document(
        id=uuid.uuid4(),
        ctype="document",
        title="task-1.pdf",
        document_type_id=doc_type.id,
        parent_id=user.home_folder_id,
    )
    doc2 = orm.Document(
        id=uuid.uuid4(),
        ctype="document",
        title="task-2.pdf",
        document_type_id=doc_type.id,
        parent_id=user.home_folder_id,
    )
    doc3 = orm.Document(
        id=uuid.uuid4(),
        ctype="document",
        title="task-3.pdf",
        document_type_id=doc_type.id,
        parent_id=user.home_folder_id,
    )
    db_session.add_all([doc1, doc2, doc3])
    await db_session.flush()

    await ownership_api.set_owners(
        session=db_session,
        resource_type=types.ResourceType.NODE,
        resource_ids=[doc1.id, doc2.id, doc3.id],
        owner=owner
    )

    value_data = cf_schema.SetCustomFieldValue(
        field_id=field.id,
        value="high"
    )
    await cf_dbapi.set_custom_field_value(db_session, doc1.id, value_data)
    await cf_dbapi.set_custom_field_value(db_session, doc2.id, value_data)
    await cf_dbapi.set_custom_field_value(
        db_session, doc3.id,
        cf_schema.SetCustomFieldValue(
            field_id=field.id,
            value="medium"
        )
    )

    high_count = await cf_dbapi.count_documents_by_option_value(
        db_session, field.id, "high", user_id=user.id
    )
    low_count = await cf_dbapi.count_documents_by_option_value(
        db_session, field.id, "low", user_id=user.id
    )

    assert high_count == 2  # used in two documents
    assert low_count == 0 # not used in any document

    option_usage_counts = await cf_dbapi.get_option_usage_counts(
        db_session,
        field_id=field.id,
        user_id=user.id,
        option_values=[
            "low", "high", "medium"
        ]
    )

    assert option_usage_counts == {
        "low": 0,
        "medium": 1,
        "high": 2
    }


async def test_migrate_option_values_of_cf_type_select(
    db_session: AsyncSession,
    user,
    make_custom_field_select,
):
    """
    Migrate custom field values of type "select".

    Setup:
    - Create custom field of type "select" named "Priority" with options:
        * high
        * medium
        * low
    - Create document type with the field
    - Create 3 documents:
        * doc1 with Priority="high"
        * doc2 with Priority="high"
        * doc3 with Priority="medium"
    - Migrate "high" → "h"

    Expected:
    - doc1 and doc2 now have Priority="h"
    - doc3 still has Priority="medium"
    - Migration result shows 2 documents updated
    """
    owner = types.Owner.create_from(user_id=user.id)
    field = await make_custom_field_select(
        name="Priority",
        options=[
            cf_types.opt(value="high", label="High"),
            cf_types.opt(value="medium", label="Medium"),
            cf_types.opt(value="low", label="Low")
        ],
        owner=owner
    )

    # Create document type
    dt_data = dt_schema.CreateDocumentType(
        name="Task",
        custom_field_ids=[field.id],
        owner_type=types.OwnerType.USER,
        owner_id=user.id
    )
    doc_type = await dt_dbapi.create_document_type(db_session, data=dt_data)

    # Create documents
    doc1 = orm.Document(
        id=uuid.uuid4(),
        ctype="document",
        title="task-1.pdf",
        document_type_id=doc_type.id,
        parent_id=user.home_folder_id,
    )
    doc2 = orm.Document(
        id=uuid.uuid4(),
        ctype="document",
        title="task-2.pdf",
        document_type_id=doc_type.id,
        parent_id=user.home_folder_id,
    )
    doc3 = orm.Document(
        id=uuid.uuid4(),
        ctype="document",
        title="task-3.pdf",
        document_type_id=doc_type.id,
        parent_id=user.home_folder_id,
    )
    db_session.add_all([doc1, doc2, doc3])
    await db_session.flush()

    await ownership_api.set_owners(
        session=db_session,
        resource_type=types.ResourceType.NODE,
        resource_ids=[doc1.id, doc2.id, doc3.id],
        owner=owner
    )

    # Set custom field values
    await cf_dbapi.set_custom_field_value(
        db_session, doc1.id,
        cf_schema.SetCustomFieldValue(field_id=field.id, value="high")
    )
    await cf_dbapi.set_custom_field_value(
        db_session, doc2.id,
        cf_schema.SetCustomFieldValue(field_id=field.id, value="high")
    )
    await cf_dbapi.set_custom_field_value(
        db_session, doc3.id,
        cf_schema.SetCustomFieldValue(field_id=field.id, value="medium")
    )

    # Verify initial state
    cfv1_before = await cf_dbapi.get_custom_field_value(db_session, doc1.id, field.id)
    cfv2_before = await cf_dbapi.get_custom_field_value(db_session, doc2.id, field.id)
    cfv3_before = await cf_dbapi.get_custom_field_value(db_session, doc3.id, field.id)
    assert cfv1_before.value.raw == "high"
    assert cfv2_before.value.raw == "high"
    assert cfv3_before.value.raw == "medium"

    # Migrate "high" → "h"
    result = await cf_dbapi.migrate_option_values(
        session=db_session,
        field_id=field.id,
        mappings=[{"old_value": "high", "new_value": "h"}],
        user_id=user.id,
    )

    # Verify migration result
    assert result["success"] is True
    assert result["total_documents_migrated"] == 2
    assert len(result["results"]) == 1
    assert result["results"][0]["old_value"] == "high"
    assert result["results"][0]["new_value"] == "h"
    assert result["results"][0]["documents_updated"] == 2
    assert len(result["errors"]) == 0

    # Verify documents were updated
    cfv1_after = await cf_dbapi.get_custom_field_value(db_session, doc1.id, field.id)
    cfv2_after = await cf_dbapi.get_custom_field_value(db_session, doc2.id, field.id)
    cfv3_after = await cf_dbapi.get_custom_field_value(db_session, doc3.id, field.id)

    assert cfv1_after.value.raw == "h"
    assert cfv2_after.value.raw == "h"
    assert cfv3_after.value.raw == "medium"  # unchanged


async def test_migrate_option_values_of_cf_type_multiselect(
    db_session: AsyncSession,
    user,
    make_custom_field_multiselect,
):
    """
    Migrate custom field values of type "multiselect".

    Setup:
    - Create custom field of type "multiselect" named "Departments" with options:
        * hr
        * finance
        * legal
    - Create document type with the field
    - Create 3 documents:
        * doc1 with Departments=["hr", "finance"]
        * doc2 with Departments=["hr", "legal"]
        * doc3 with Departments=["finance"]
    - Migrate "hr" → "human_resources"

    Expected:
    - doc1 now has Departments=["human_resources", "finance"]
    - doc2 now has Departments=["human_resources", "legal"]
    - doc3 still has Departments=["finance"] (unchanged)
    - Migration result shows 2 documents updated
    """
    owner = types.Owner.create_from(user_id=user.id)
    field = await make_custom_field_multiselect(
        name="Departments",
        options=[
            cf_types.opt(value="hr", label="Human Resources"),
            cf_types.opt(value="finance", label="Finance"),
            cf_types.opt(value="legal", label="Legal")
        ],
        owner=owner
    )

    # Create document type
    dt_data = dt_schema.CreateDocumentType(
        name="Policy",
        custom_field_ids=[field.id],
        owner_type=types.OwnerType.USER,
        owner_id=user.id
    )
    doc_type = await dt_dbapi.create_document_type(db_session, data=dt_data)

    # Create documents
    doc1 = orm.Document(
        id=uuid.uuid4(),
        ctype="document",
        title="policy-1.pdf",
        document_type_id=doc_type.id,
        parent_id=user.home_folder_id,
    )
    doc2 = orm.Document(
        id=uuid.uuid4(),
        ctype="document",
        title="policy-2.pdf",
        document_type_id=doc_type.id,
        parent_id=user.home_folder_id,
    )
    doc3 = orm.Document(
        id=uuid.uuid4(),
        ctype="document",
        title="policy-3.pdf",
        document_type_id=doc_type.id,
        parent_id=user.home_folder_id,
    )
    db_session.add_all([doc1, doc2, doc3])
    await db_session.flush()

    await ownership_api.set_owners(
        session=db_session,
        resource_type=types.ResourceType.NODE,
        resource_ids=[doc1.id, doc2.id, doc3.id],
        owner=owner
    )

    # Set custom field values
    await cf_dbapi.set_custom_field_value(
        db_session, doc1.id,
        cf_schema.SetCustomFieldValue(field_id=field.id, value=["hr", "finance"])
    )
    await cf_dbapi.set_custom_field_value(
        db_session, doc2.id,
        cf_schema.SetCustomFieldValue(field_id=field.id, value=["hr", "legal"])
    )
    await cf_dbapi.set_custom_field_value(
        db_session, doc3.id,
        cf_schema.SetCustomFieldValue(field_id=field.id, value=["finance"])
    )

    # Verify initial state
    cfv1_before = await cf_dbapi.get_custom_field_value(db_session, doc1.id, field.id)
    cfv2_before = await cf_dbapi.get_custom_field_value(db_session, doc2.id, field.id)
    cfv3_before = await cf_dbapi.get_custom_field_value(db_session, doc3.id, field.id)
    assert set(cfv1_before.value.raw) == {"hr", "finance"}
    assert set(cfv2_before.value.raw) == {"hr", "legal"}
    assert set(cfv3_before.value.raw) == {"finance"}

    # Migrate "hr" → "human_resources"
    result = await cf_dbapi.migrate_option_values(
        session=db_session,
        field_id=field.id,
        mappings=[{"old_value": "hr", "new_value": "human_resources"}],
        user_id=user.id,
    )

    # Verify migration result
    assert result["success"] is True
    assert result["total_documents_migrated"] == 2
    assert len(result["results"]) == 1
    assert result["results"][0]["old_value"] == "hr"
    assert result["results"][0]["new_value"] == "human_resources"
    assert result["results"][0]["documents_updated"] == 2
    assert len(result["errors"]) == 0

    # Verify documents were updated
    cfv1_after = await cf_dbapi.get_custom_field_value(db_session, doc1.id, field.id)
    cfv2_after = await cf_dbapi.get_custom_field_value(db_session, doc2.id, field.id)
    cfv3_after = await cf_dbapi.get_custom_field_value(db_session, doc3.id, field.id)

    assert set(cfv1_after.value.raw) == {"human_resources", "finance"}
    assert set(cfv2_after.value.raw) == {"human_resources", "legal"}
    assert set(cfv3_after.value.raw) == {"finance"}  # unchanged
