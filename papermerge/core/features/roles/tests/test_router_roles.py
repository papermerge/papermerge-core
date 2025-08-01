from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from papermerge.core import schema, dbapi
from papermerge.core.features.roles.db import orm
from papermerge.core.tests.types import AuthTestClient


async def test_creating_role_when_no_perms_are_in_sys(
    auth_api_client: AuthTestClient, db_session: AsyncSession
):
    """If user attempts to create a role when there are
    no permissions in the system (e.g. permissions were not synced),
    then role creation should fail"""
    response = await auth_api_client.post(
        "/roles/",
        json={"name": "Admin", "scopes": []},
    )

    assert response.status_code == 500, response.json()


async def test_create_role_route(auth_api_client: AuthTestClient, db_session: AsyncSession):
    await dbapi.sync_perms(db_session)

    count_before = await db_session.scalar(select(func.count(orm.Role.id)))
    assert count_before == 0

    response = await auth_api_client.post(
        "/roles/",
        json={"name": "Admin", "scopes": []},
    )

    assert response.status_code == 201, response.json()

    count_after = await db_session.scalar(select(func.count(orm.Role.id)))
    assert count_after == 1


async def test_update_role_route(auth_api_client: AuthTestClient, make_role, db_session: AsyncSession):
    role = await make_role(name="demo")

    await dbapi.sync_perms(db_session)
    response = await auth_api_client.patch(
        f"/roles/{role.id}",
        json={"name": "Admin", "scopes": ["user.view", "custom_field.view"]},
    )

    assert response.status_code == 200, response.json()
    updated_role = await dbapi.get_role(db_session, role_id=role.id)

    assert set(updated_role.scopes) == {"user.view", "custom_field.view"}


async def test_get_role_details(
    make_role, auth_api_client: AuthTestClient, db_session: AsyncSession
):
    role = await make_role(name="demo")

    response = await auth_api_client.get(f"/roles/{role.id}")

    assert response.status_code == 200, response.json()


async def test_pagination_role_route_basic(auth_api_client: AuthTestClient):
    params = {"page_number": 1, "page_size": 1}
    response = await auth_api_client.get("/roles/", params=params)

    assert response.status_code == 200, response.json()


async def test_roles_paginated_result__8_items_first_page(
    make_role, auth_api_client: AuthTestClient
):
    total_roles = 8
    for i in range(total_roles):
        await make_role(name=f"Role {i}")

    params = {"page_size": 5, "page_number": 1}
    response = await auth_api_client.get("/roles/", params=params)

    assert response.status_code == 200, response.json()

    paginated_items = schema.PaginatedResponse[schema.Role](**response.json())

    assert paginated_items.page_size == 5
    assert paginated_items.page_number == 1
    assert paginated_items.num_pages == 2
    assert len(paginated_items.items) == 5


async def test_roles_paginated_result__8_items_second_page(
    make_role, auth_api_client: AuthTestClient
):
    total_roles = 8
    for i in range(total_roles):
        await make_role(name=f"Role {i}")

    params = {"page_size": 5, "page_number": 2}
    response = await auth_api_client.get("/roles/", params=params)

    assert response.status_code == 200, response.json()

    paginated_items = schema.PaginatedResponse[schema.Role](**response.json())

    assert paginated_items.page_size == 5
    assert paginated_items.page_number == 2
    assert paginated_items.num_pages == 2
    # 8 - 3 = 5 (total items = 8, minus items on first page)
    assert len(paginated_items.items) == 3


async def test_roles_paginated_result__8_items_4th_page(
    make_role, auth_api_client: AuthTestClient
):
    total_roles = 8
    for i in range(total_roles):
        await make_role(name=f"Role {i}")

    params = {"page_size": 5, "page_number": 4}
    response = await auth_api_client.get("/roles/", params=params)

    assert response.status_code == 200, response.json()

    paginated_items = schema.PaginatedResponse[schema.Role](**response.json())

    assert paginated_items.page_size == 5
    assert paginated_items.page_number == 4
    assert paginated_items.num_pages == 2
    assert len(paginated_items.items) == 0


async def test_roles_list_without_pagination(make_role, auth_api_client: AuthTestClient):
    total_roles = 8
    for i in range(total_roles):
        await make_role(name=f"Role {i}")

    response = await auth_api_client.get("/roles/all")

    assert response.status_code == 200, response.json()

    items = [schema.Role(**kw) for kw in response.json()]

    assert len(items) == 8
