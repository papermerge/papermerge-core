from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from papermerge.core import schema
from papermerge.core.features.groups.db import orm
from papermerge.core.tests.types import AuthTestClient


async def test_create_group_route(auth_api_client: AuthTestClient, db_session: AsyncSession):
    count_before = await db_session.scalar(select(func.count(orm.Group.id)))
    assert count_before == 0

    response = await auth_api_client.post(
        "/groups/",
        json={"name": "Admin"},
    )

    assert response.status_code == 201, response.json()
    count_after = await db_session.scalar(select(func.count(orm.Group.id)))
    assert count_after == 1

async def test_update_group_route(auth_api_client: AuthTestClient, make_group, db_session: AsyncSession):
    group = await make_group(name="demo")

    response = await auth_api_client.patch(
        f"/groups/{group.id}",
        json={"name": "Admin"},
    )

    assert response.status_code == 200, response.json()


async def test_get_group_details(
    make_group, auth_api_client: AuthTestClient, db_session: AsyncSession
):
    group = await make_group(name="demo")

    response = await auth_api_client.get(f"/groups/{group.id}")

    assert response.status_code == 200, response.json()


async def test_pagination_group_route_basic(auth_api_client: AuthTestClient):
    params = {"page_number": 1, "page_size": 1}
    response = await auth_api_client.get("/groups/", params=params)

    assert response.status_code == 200, response.json()


async def test_groups_paginated_result__8_items_first_page(
    make_group, auth_api_client: AuthTestClient
):
    total_groups = 8
    for i in range(total_groups):
        await make_group(name=f"Group {i}")

    params = {"page_size": 5, "page_number": 1}
    response = await auth_api_client.get("/groups/", params=params)

    assert response.status_code == 200, response.json()

    paginated_items = schema.PaginatedResponse[schema.Group](**response.json())

    assert paginated_items.page_size == 5
    assert paginated_items.page_number == 1
    assert paginated_items.num_pages == 2
    assert len(paginated_items.items) == 5


async def test_groups_paginated_result__8_items_second_page(
    make_group, auth_api_client: AuthTestClient
):
    total_groups = 8
    for i in range(total_groups):
        await make_group(name=f"Group {i}")

    params = {"page_size": 5, "page_number": 2}
    response = await auth_api_client.get("/groups/", params=params)

    assert response.status_code == 200, response.json()

    paginated_items = schema.PaginatedResponse[schema.Group](**response.json())

    assert paginated_items.page_size == 5
    assert paginated_items.page_number == 2
    assert paginated_items.num_pages == 2
    # 8 - 3 = 5 (total items = 8, minus items on first page)
    assert len(paginated_items.items) == 3


async def test_groups_paginated_result__8_items_4th_page(
    make_group, auth_api_client: AuthTestClient
):
    total_groups = 8
    for i in range(total_groups):
        await make_group(name=f"Group {i}")

    params = {"page_size": 5, "page_number": 4}
    response = await auth_api_client.get("/groups/", params=params)

    assert response.status_code == 200, response.json()

    paginated_items = schema.PaginatedResponse[schema.Group](**response.json())

    assert paginated_items.page_size == 5
    assert paginated_items.page_number == 4
    assert paginated_items.num_pages == 2
    assert len(paginated_items.items) == 0


async def test_groups_list_without_pagination(make_group, auth_api_client: AuthTestClient):
    total_groups = 8
    for i in range(total_groups):
        await make_group(name=f"Group {i}")

    response = await auth_api_client.get("/groups/all")

    assert response.status_code == 200, response.json()

    items = [schema.Group(**kw) for kw in response.json()]

    assert len(items) == 8
