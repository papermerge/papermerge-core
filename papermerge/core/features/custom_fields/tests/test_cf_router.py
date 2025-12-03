import uuid

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from papermerge.core import schema, orm
from papermerge.core.tests.types import AuthTestClient


async def test_create_custom_field(
    auth_api_client: AuthTestClient,
    db_session: AsyncSession
):
    # Use async query methods for AsyncSession
    count_before_result = await db_session.execute(select(func.count(orm.CustomField.id)))
    count_before = count_before_result.scalar()
    assert count_before == 0

    # Make async HTTP request
    response = await auth_api_client.test_client.post(
        "/custom-fields/", json={
            "name": "cf1",
            "type_handler": "integer",
            "config": {},
            "owner_type": "user",
            "owner_id": str(auth_api_client.user.id)
        }
    )
    assert response.status_code == 201, response.json()

    # Use async query methods for AsyncSession
    count_after_result = await db_session.execute(select(func.count(orm.CustomField.id)))
    count_after = count_after_result.scalar()
    assert count_after == 1


async def test_create_monetary_custom_field(
    auth_api_client: AuthTestClient,
    db_session: AsyncSession
):
    count_before_result = await db_session.execute(select(func.count(orm.CustomField.id)))
    count_before = count_before_result.scalar()
    assert count_before == 0

    data = {
        "name": "Price",
        "type_handler": "monetary",
        "config": {"currency": "EUR", "precision": 2},
        "owner_type": "user",
        "owner_id": str(auth_api_client.user.id)
    }
    response = await auth_api_client.post(
        "/custom-fields/",
        json=data,
    )
    assert response.status_code == 201, response.json()

    count_after_result = await db_session.execute(select(func.count(orm.CustomField.id)))
    count_after = count_after_result.scalar()
    assert count_after == 1

    response = await auth_api_client.get("/custom-fields/")
    assert response.status_code == 200, response.json()


async def test_custom_field_duplicate_name(
    auth_api_client: AuthTestClient, db_session: AsyncSession
):
    """Make sure there is an error on custom field duplicate name"""
    count_before_result = await db_session.execute(select(func.count(orm.CustomField.id)))
    count_before = count_before_result.scalar()

    assert count_before == 0

    response = await auth_api_client.post(
        "/custom-fields/", json={
            "name": "cf1", "type_handler": "integer", "config": {},
            "owner_type": "user",
            "owner_id": str(auth_api_client.user.id)
        }
    )
    assert response.status_code == 201, response.json()

    # custom field with same name
    response = await auth_api_client.post(
        "/custom-fields/", json={
            "name": "cf1",
            "type_handler": "text",
            "config": {},
            "owner_type": "user",
            "owner_id": str(auth_api_client.user.id)
        }
    )
    assert response.status_code == 400, response.json()


async def test_update_custom_field(
    auth_api_client: AuthTestClient,
    db_session: AsyncSession,
    make_custom_field_v2
):
    field = await make_custom_field_v2(
        name="Shop Name",
        type_handler="text"
    )

    count_before_result = await db_session.execute(select(func.count(orm.CustomField.id)))
    count_before = count_before_result.scalar()
    assert count_before == 1

    response = await auth_api_client.patch(
        f"/custom-fields/{field.id}",
        json={"name": "cf1_updated"},
    )
    assert response.status_code == 200, response.json()
    updated_cf = schema.CustomField(**response.json())
    assert updated_cf.name == "cf1_updated"


async def test_delete_custom_field(
    auth_api_client: AuthTestClient,
    db_session: AsyncSession,
    make_custom_field_v2,
):
    field = await make_custom_field_v2(
        name="Shop Name",
        type_handler="text"
    )

    count_before_result = await db_session.execute(select(func.count(orm.CustomField.id)))
    count_before = count_before_result.scalar()
    assert count_before == 1

    response = await auth_api_client.delete(f"/custom-fields/{field.id}")
    assert response.status_code == 204

    stmt = select(
        func.count(orm.CustomField.id)
    ).where(
        orm.CustomField.deleted_at.is_(None)
    )
    count_after_result = await db_session.execute(stmt)
    count_after = count_after_result.scalar()
    assert count_after == 0


async def test_custom_fields_paginated_result__8_items_first_page(
    make_custom_field_v2, auth_api_client: AuthTestClient
):
    total_groups = 8
    for i in range(total_groups):
        await make_custom_field_v2(name=f"CF {i}", type_handler="text")

    params = {"page_size": 5, "page_number": 1}
    response = await auth_api_client.get("/custom-fields/", params=params)

    assert response.status_code == 200, response.json()

    paginated_items = schema.PaginatedResponse[schema.CustomField](**response.json())

    assert paginated_items.page_size == 5
    assert paginated_items.page_number == 1
    assert paginated_items.num_pages == 2
    assert len(paginated_items.items) == 5


async def test_custom_fields_without_pagination(
    make_custom_field_v2, auth_api_client: AuthTestClient
):
    total_groups = 8
    for i in range(total_groups):
        await make_custom_field_v2(name=f"CF {i}", type_handler="text")

    response = await auth_api_client.get("/custom-fields/all")

    assert response.status_code == 200, response.json()

    items = [schema.CustomField(**kw) for kw in response.json()]

    assert len(items) == 8


async def test__negative__custom_fields_all_route_with_group_id_param(
    make_custom_field_v2, auth_api_client: AuthTestClient
):
    """In this scenario current user does not belong to the
    group provided as parameter"""
    total_groups = 8
    for i in range(total_groups):
        await make_custom_field_v2(name=f"CF {i}", type_handler="text")

    group_id = uuid.uuid4()
    response = await auth_api_client.get(
        "/custom-fields/all", params={"group_id": str(group_id)}
    )

    assert response.status_code == 403, response.json()


async def test__positive__custom_fields_all_route_with_group_id_param(
    db_session: AsyncSession,
    make_custom_field_v2,
    auth_api_client: AuthTestClient,
    user,
    make_group
):
    """In this scenario current user belongs to the
    group provided as parameter and there are two custom fields
    belonging to that group. In such case endpoint should
    return only two custom fields: the both belonging to the group
    """
    group: orm.Group = await make_group("research")
    # Before modifying groups, load the user with the relationship
    stmt = select(orm.User).options(selectinload(orm.User.user_groups)).where(orm.User.id == user.id)
    result = await db_session.execute(stmt)
    user = result.scalar_one()

    total_groups = 8
    for i in range(total_groups):
        # privately owned custom fields
        await make_custom_field_v2(name=f"CF {i}", type_handler="text")

    await make_custom_field_v2(
        name=f"CF Research 1", type_handler="text", group_id=group.id
    )
    await make_custom_field_v2(
        name=f"CF Research 2", type_handler="text", group_id=group.id
    )

    user_group = orm.UserGroup(user_id=user.id, group_id=group.id)
    db_session.add(user_group)

    await db_session.commit()

    response = await auth_api_client.get(
        "/custom-fields/all", params={"group_id": str(group.id)}
    )

    assert response.status_code == 200, response.json()
    dtype_names = {schema.CustomField(**kw).name for kw in response.json()}
    assert dtype_names == {"CF Research 1", "CF Research 2"}


async def test_get_custom_field(
    auth_api_client: AuthTestClient,
    db_session: AsyncSession,
    make_custom_field_v2
):
    """Test retrieving a custom field by ID"""
    field = await make_custom_field_v2(
        name="Invoice Number",
        type_handler="text"
    )

    response = await auth_api_client.get(f"/custom-fields/{field.id}")

    assert response.status_code == 200
    custom_field = schema.CustomFieldDetails(**response.json())
    assert custom_field.id == field.id
    assert custom_field.name == "Invoice Number"
    assert custom_field.type_handler == "text"


async def test_get_custom_field_not_found(
    auth_api_client: AuthTestClient,
    db_session: AsyncSession,
):
    """Test 404 when custom field doesn't exist"""
    non_existent_id = uuid.uuid4()

    response = await auth_api_client.get(f"/custom-fields/{non_existent_id}")

    assert response.status_code == 404


async def test_get_custom_field_forbidden(
    make_api_client,
    make_custom_field_v2,
    db_session: AsyncSession,
):
    """Test 403 when user doesn't have permission to access the custom field"""
    # Create custom field as user1
    client1 = await make_api_client("user1")
    field = await make_custom_field_v2(
        name="Private Field",
        type_handler="text"
    )

    # Try to access as user2
    client2 = await make_api_client("user2")
    response = await client2.get(f"/custom-fields/{field.id}")

    assert response.status_code == 404


async def test_create_select_custom_field_via_api(
    auth_api_client: AuthTestClient,
    db_session: AsyncSession
):
    """Create a select custom field with 'free' and 'paid' options via API"""
    count_before_result = await db_session.execute(
        select(func.count(orm.CustomField.id))
    )
    count_before = count_before_result.scalar()
    assert count_before == 0

    data = {
        "name": "Subscription",
        "type_handler": "select",
        "config": {
            "options": [
                {"value": "free", "label": "Free"},
                {"value": "paid", "label": "Paid"}
            ]
        },
        "owner_type": "user",
        "owner_id": str(auth_api_client.user.id)
    }

    response = await auth_api_client.post(
        "/custom-fields/",
        json=data,
    )
    assert response.status_code == 201, response.json()

    # Verify record was created in database
    count_after_result = await db_session.execute(
        select(func.count(orm.CustomField.id))
    )
    count_after = count_after_result.scalar()
    assert count_after == 1

    # Validate response data
    custom_field = schema.CustomField(**response.json())
    assert custom_field.name == "Subscription"
    assert custom_field.type_handler == "select"

    # Verify config contains the two options
    assert "options" in custom_field.config
    options = custom_field.config["options"]
    assert len(options) == 2

    # Extract option values and labels
    option_values = [opt["value"] for opt in options]
    option_labels = [opt["label"] for opt in options]

    assert "free" in option_values
    assert "paid" in option_values
    assert "Free" in option_labels
    assert "Paid" in option_labels

    # Verify default config values
    assert custom_field.config.get("allow_custom") is False
    assert custom_field.config.get("required") is False


async def test_create_multiselect_custom_field_via_api(
    auth_api_client: AuthTestClient,
    db_session: AsyncSession
):
    """Create a multiselect custom field with 'financial' and 'legal' options via API"""
    count_before_result = await db_session.execute(
        select(func.count(orm.CustomField.id))
    )
    count_before = count_before_result.scalar()
    assert count_before == 0

    data = {
        "name": "Categories",
        "type_handler": "multiselect",
        "config": {
            "options": [
                {"value": "financial", "label": "Financial"},
                {"value": "legal", "label": "Legal"}
            ]
        },
        "owner_type": "user",
        "owner_id": str(auth_api_client.user.id)
    }

    response = await auth_api_client.post(
        "/custom-fields/",
        json=data,
    )
    assert response.status_code == 201, response.json()

    # Verify record was created in database
    count_after_result = await db_session.execute(
        select(func.count(orm.CustomField.id))
    )
    count_after = count_after_result.scalar()
    assert count_after == 1

    # Validate response data
    custom_field = schema.CustomField(**response.json())
    assert custom_field.name == "Categories"
    assert custom_field.type_handler == "multiselect"

    # Verify config contains the two options
    assert "options" in custom_field.config
    options = custom_field.config["options"]
    assert len(options) == 2

    # Extract option values and labels
    option_values = [opt["value"] for opt in options]
    option_labels = [opt["label"] for opt in options]

    assert "financial" in option_values
    assert "legal" in option_values
    assert "Financial" in option_labels
    assert "Legal" in option_labels

    # Verify default config values specific to multiselect
    assert custom_field.config.get("allow_custom") is False
    assert custom_field.config.get("required") is False
    assert custom_field.config.get("min_selections") is None
    assert custom_field.config.get("max_selections") is None
    assert custom_field.config.get("separator") == ", "
