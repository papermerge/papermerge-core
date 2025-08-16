from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from papermerge.core import schema, dbapi, orm
from papermerge.core.tests.types import AuthTestClient
from .utils import verify_password


async def test_list_users(make_user, auth_api_client: AuthTestClient):
    for i in range(3):
        await make_user(username=f"user {i}")

    response = await auth_api_client.get("/users/")

    assert response.status_code == 200, response.json()


async def test_list_users_without_pagination(make_user, auth_api_client: AuthTestClient):
    for i in range(3):
        await make_user(username=f"user {i}")

    response = await auth_api_client.get("/users/all")

    assert response.status_code == 200, response.json()


async def test_create_user(
    db_session: AsyncSession,
    make_group,
    make_role,
    auth_api_client: AuthTestClient
):
    await dbapi.sync_perms(db_session)
    role = await make_role(name="guest", scopes=["node.create", "node.view"])
    group = await make_group(name="demo")
    data = {
        "username": "friedrich",
        "email": "friedrich@example.com",
        "group_ids": [str(group.id)],
        "role_ids": [str(role.id)],
        "is_active": True,
        "is_superuser": False,
        "password": "blah",
    }
    response = await auth_api_client.post("/users/", json=data)
    created_user_data = response.json()
    user_id = created_user_data["id"]

    result = await db_session.execute(
        select(orm.User)
        .options(
            selectinload(orm.User.groups),
            selectinload(orm.User.roles)
        )
        .where(orm.User.id == user_id)
    )
    created_user = result.scalar_one()

    # Assert user has the expected group
    assert len(created_user.groups) == 1
    assert created_user.groups[0].id == group.id
    assert created_user.groups[0].name == "demo"

    # Assert user has the expected role
    assert len(created_user.roles) == 1
    assert created_user.roles[0].id == role.id
    assert created_user.roles[0].name == "guest"

    # Additional assertions for user properties
    assert created_user.username == "friedrich"
    assert created_user.email == "friedrich@example.com"
    assert created_user.is_active == True
    assert created_user.is_superuser == False

    assert response.status_code == 201, response.json()


async def test_update_user_roles(
    db_session: AsyncSession,
    make_group,
    make_role,
    auth_api_client: AuthTestClient
):
    await dbapi.sync_perms(db_session)
    role1 = await make_role(name="guest1", scopes=["node.create", "node.view"])
    role2 = await make_role(name="guest2", scopes=["tag.create", "tag.view"])

    data = {
        "username": "friedrich",
        "email": "friedrich@example.com",
        "group_ids": [],
        "role_ids": [str(role1.id), str(role2.id)],
        "is_active": True,
        "is_superuser": False,
        "password": "blah",
    }
    response = await auth_api_client.post("/users/", json=data)
    assert response.status_code == 201, response.json()

    created_user_data = schema.User(**response.json())
    update = {
        "role_ids": [str(role1.id)],
    }

    response = await auth_api_client.patch(f"/users/{created_user_data.id}", json=update)
    assert response.status_code == 200, response.json()

    created_user_data = schema.UserDetails(**response.json())
    assert len(created_user_data.roles) == 1



async def test_get_user_details(
    make_user, make_group, auth_api_client: AuthTestClient, db_session: AsyncSession
):
    """In this scenario user belongs to one group"""
    user = await make_user(username="Karl")
    group = await make_group(name="demo")

    attrs = schema.UpdateUser(group_ids=[group.id])
    await dbapi.update_user(db_session, user_id=user.id, attrs=attrs)

    response = await auth_api_client.get(f"/users/{user.id}")

    assert response.status_code == 200, response.json()


async def test_delete_user(
    make_user, make_group, auth_api_client: AuthTestClient, db_session: AsyncSession
):
    user = await make_user(username="Karl")
    group = await make_group(name="demo")

    attrs = schema.UpdateUser(group_ids=[group.id])
    await dbapi.update_user(db_session, user_id=user.id, attrs=attrs)

    response = await auth_api_client.delete(f"/users/{user.id}")

    assert response.status_code == 204, response.text


async def test_change_user_password(
    make_user, auth_api_client: AuthTestClient, random_string, db_session: AsyncSession
):
    user = await make_user(username="Karl")

    data = {"userId": str(user.id), "password": random_string}

    response = await auth_api_client.post(f"/users/{user.id}/change-password", json=data)

    assert response.status_code == 200, response.text
    stmt = select(orm.User).where(orm.User.id == user.id)
    db_user = (await db_session.execute(stmt)).scalar()

    assert verify_password(random_string, db_user.password)


async def test_users_paginated_result__9_items_first_page(
    make_user, auth_api_client: AuthTestClient
):
    # keep in mind that there are actually 9 users, not 8
    # 9th user is the one created for authentication i.e.
    # the one currently being authenticated
    total_users = 8
    for i in range(total_users):
        await make_user(username=f"user {i}")

    params = {"page_size": 5, "page_number": 1}
    response = await auth_api_client.get("/users/", params=params)

    assert response.status_code == 200, response.json()

    paginated_items = schema.PaginatedResponse[schema.User](**response.json())

    assert paginated_items.page_size == 5
    assert paginated_items.page_number == 1
    assert paginated_items.num_pages == 2
    assert len(paginated_items.items) == 5
