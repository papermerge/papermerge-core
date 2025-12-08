"""
Tests for get_option_usage_counts endpoint.
"""
import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from papermerge.core import orm, types
from papermerge.core.features.custom_fields import schema as cf_schema
from papermerge.core.features.custom_fields import types as cf_types
from papermerge.core.features.custom_fields.db import api as cf_dbapi
from papermerge.core.features.document_types.db import api as dt_dbapi
from papermerge.core.features.document_types import schema as dt_schema
from papermerge.core.features.ownership.db import api as ownership_api
from papermerge.core.tests.types import AuthTestClient


async def test_get_option_usage_counts_missing_option_values(
        auth_api_client: AuthTestClient,
        db_session: AsyncSession,
        make_custom_field_select,
):
    """
    Request without option_values query param should return 422.

    option_values is required and must have at least one value.
    """
    user = auth_api_client.user
    owner = types.Owner.create_from(user_id=user.id)

    field = await make_custom_field_select(
        name="Priority",
        options=[
            cf_types.opt(value="high", label="High"),
            cf_types.opt(value="low", label="Low")
        ],
        owner=owner
    )

    response = await auth_api_client.get(
        f"/custom-fields/{field.id}/usage-counts"
    )

    assert response.status_code == 422


async def test_get_option_usage_counts_with_single_option(
    auth_api_client: AuthTestClient,
    db_session: AsyncSession,
    make_custom_field_select,
):
    """
    Request with single option_values should return count for that option.

    Setup:
    - Create select field with options: high, medium, low
    - Create 2 documents with Priority="high"
    - Request usage count for "high" only

    Expected:
    - Returns {"high": 2}
    """
    user = auth_api_client.user
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
    db_session.add_all([doc1, doc2])
    await db_session.flush()

    await ownership_api.set_owners(
        session=db_session,
        resource_type=types.ResourceType.NODE,
        resource_ids=[doc1.id, doc2.id],
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

    response = await auth_api_client.get(
        f"/custom-fields/{field.id}/usage-counts",
        params={"option_values": "high"}
    )

    assert response.status_code == 200
    assert response.json() == {"high": 2}


async def test_get_option_usage_counts_with_multiple_options(
    auth_api_client: AuthTestClient,
    db_session: AsyncSession,
    make_custom_field_select,
):
    """
    Request with multiple option_values should return counts for all.

    Setup:
    - Create select field with options: high, medium, low
    - Create 3 documents:
        * doc1 with Priority="high"
        * doc2 with Priority="high"
        * doc3 with Priority="medium"
    - Request usage counts for "high", "medium", "low"

    Expected:
    - Returns {"high": 2, "medium": 1, "low": 0}
    """
    user = auth_api_client.user
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

    response = await auth_api_client.get(
        f"/custom-fields/{field.id}/usage-counts",
        params={"option_values": ["high", "medium", "low"]}
    )

    assert response.status_code == 200
    assert response.json() == {"high": 2, "medium": 1, "low": 0}


async def test_get_option_usage_counts_custom_field_not_found(
    auth_api_client: AuthTestClient,
    db_session: AsyncSession,
):
    """
    Request for non-existent custom field should return 404.
    """
    non_existent_id = uuid.uuid4()

    response = await auth_api_client.get(
        f"/custom-fields/{non_existent_id}/usage-counts",
        params={"option_values": "high"}
    )

    assert response.status_code == 404


async def test_get_option_usage_counts_forbidden_for_other_user(
    make_api_client,
    db_session: AsyncSession,
    make_custom_field_select,
):
    """
    User should not be able to access usage counts for another user's custom field.
    """
    # Create custom field as user1
    client1 = await make_api_client("user1")
    owner1 = types.Owner.create_from(user_id=client1.user.id)

    field = await make_custom_field_select(
        name="Priority",
        options=[
            cf_types.opt(value="high", label="High"),
            cf_types.opt(value="low", label="Low")
        ],
        owner=owner1
    )

    # Try to access as user2
    client2 = await make_api_client("user2")

    response = await client2.get(
        f"/custom-fields/{field.id}/usage-counts",
        params={"option_values": "high"}
    )

    assert response.status_code == 404  # 404 to not leak existence
