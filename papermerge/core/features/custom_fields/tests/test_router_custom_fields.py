import json
import uuid

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from papermerge.core import schema, orm
from papermerge.core.tests.types import AuthTestClient


async def test_create_custom_field(auth_api_client: AuthTestClient, db_session: AsyncSession):
    # Use async query methods for AsyncSession
    count_before_result = await db_session.execute(select(func.count(orm.CustomField.id)))
    count_before = count_before_result.scalar()
    assert count_before == 0

    # Make async HTTP request
    response = await auth_api_client.test_client.post(
        "/custom-fields/", json={"name": "cf1", "type": "int"}
    )
    assert response.status_code == 201, response.json()

    # Use async query methods for AsyncSession
    count_after_result = await db_session.execute(select(func.count(orm.CustomField.id)))
    count_after = count_after_result.scalar()
    assert count_after == 1


async def test_create_monetary_custom_field(
    auth_api_client: AuthTestClient, db_session: AsyncSession
):
    count_before_result = await db_session.execute(select(func.count(orm.CustomField.id)))
    count_before = count_before_result.scalar()
    assert count_before == 0

    data = {
        "name": "Price",
        "type": "monetary",
        "extra_data": json.dumps({"currency": "EUR"}),
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
        "/custom-fields/", json={"name": "cf1", "type": "int"}
    )
    assert response.status_code == 201, response.json()

    # custom field with same name
    response = await auth_api_client.post(
        "/custom-fields/", json={"name": "cf1", "type": "text"}
    )
    assert response.status_code == 400, response.json()
    assert response.json() == {"detail": "Duplicate custom field name"}


async def test_update_custom_field(
    auth_api_client: AuthTestClient,
    db_session: AsyncSession,
    custom_field_cf1,
):
    count_before_result = await db_session.execute(select(func.count(orm.CustomField.id)))
    count_before = count_before_result.scalar()
    assert count_before == 1

    response = await auth_api_client.patch(
        f"/custom-fields/{custom_field_cf1.id}",
        json={"name": "cf1_updated", "type": "int"},
    )
    assert response.status_code == 200
    updated_cf = schema.CustomField(**response.json())
    assert updated_cf.name == "cf1_updated"


async def test_delete_custom_field(
    auth_api_client: AuthTestClient,
    db_session: AsyncSession,
    custom_field_cf1,
):
    count_before_result = await db_session.execute(select(func.count(orm.CustomField.id)))
    count_before = count_before_result.scalar()
    assert count_before == 1

    response = await auth_api_client.delete(f"/custom-fields/{custom_field_cf1.id}")
    assert response.status_code == 204
    count_after_result = await db_session.execute(select(func.count(orm.CustomField.id)))
    count_after = count_after_result.scalar()
    assert count_after == 0


async def test_custom_fields_paginated_result__8_items_first_page(
    make_custom_field, auth_api_client: AuthTestClient
):
    total_groups = 8
    for i in range(total_groups):
        await make_custom_field(name=f"CF {i}", type=schema.CustomFieldType.text)

    params = {"page_size": 5, "page_number": 1}
    response = await auth_api_client.get("/custom-fields/", params=params)

    assert response.status_code == 200, response.json()

    paginated_items = schema.PaginatedResponse[schema.CustomField](**response.json())

    assert paginated_items.page_size == 5
    assert paginated_items.page_number == 1
    assert paginated_items.num_pages == 2
    assert len(paginated_items.items) == 5


async def test_custom_fields_without_pagination(
    make_custom_field, auth_api_client: AuthTestClient
):
    total_groups = 8
    for i in range(total_groups):
        await make_custom_field(name=f"CF {i}", type=schema.CustomFieldType.text)

    response = await auth_api_client.get("/custom-fields/all")

    assert response.status_code == 200, response.json()

    items = [schema.CustomField(**kw) for kw in response.json()]

    assert len(items) == 8


async def test__negative__custom_fields_all_route_with_group_id_param(
    make_custom_field, auth_api_client: AuthTestClient
):
    """In this scenario current user does not belong to the
    group provided as parameter"""
    total_groups = 8
    for i in range(total_groups):
        await make_custom_field(name=f"CF {i}", type=schema.CustomFieldType.text)

    group_id = uuid.uuid4()
    response = await auth_api_client.get(
        "/custom-fields/all", params={"group_id": str(group_id)}
    )

    assert response.status_code == 403, response.json()


async def test__positive__custom_fields_all_route_with_group_id_param(
    db_session: AsyncSession,
    make_custom_field,
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
        await make_custom_field(name=f"CF {i}", type=schema.CustomFieldType.text)

    await make_custom_field(
        name=f"CF Research 1", type=schema.CustomFieldType.text, group_id=group.id
    )
    await make_custom_field(
        name=f"CF Research 2", type=schema.CustomFieldType.text, group_id=group.id
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
