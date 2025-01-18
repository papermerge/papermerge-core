from papermerge.core.db.engine import Session

from sqlalchemy import select

from papermerge.core import schema, dbapi, orm
from papermerge.core.tests.types import AuthTestClient

from .utils import verify_password


def test_list_users(make_user, auth_api_client: AuthTestClient):
    for i in range(3):
        make_user(username=f"user {i}")

    response = auth_api_client.get("/users/")

    assert response.status_code == 200, response.json()


def test_create_user(make_group, auth_api_client: AuthTestClient):
    group = make_group(name="demo")
    data = {
        "username": "friedrich",
        "email": "friedrich@example.com",
        "group_ids": [str(group.id)],
        "scopes": [],
        "is_active": True,
        "is_superuser": False,
        "password": "blah",
    }
    response = auth_api_client.post("/users/", json=data)

    assert response.status_code == 201, response.json()


def test_get_user_details(
    make_user, make_group, auth_api_client: AuthTestClient, db_session
):
    """In this scenario user belongs to one group"""
    user = make_user(username="Karl")
    group = make_group(name="demo")

    attrs = schema.UpdateUser(group_ids=[group.id])
    dbapi.update_user(db_session, user_id=user.id, attrs=attrs)

    response = auth_api_client.get(f"/users/{user.id}")

    assert response.status_code == 200, response.json()


def test_delete_user(
    make_user, make_group, auth_api_client: AuthTestClient, db_session
):
    user = make_user(username="Karl")
    group = make_group(name="demo")

    attrs = schema.UpdateUser(group_ids=[group.id])
    dbapi.update_user(db_session, user_id=user.id, attrs=attrs)

    response = auth_api_client.delete(f"/users/{user.id}")

    assert response.status_code == 204, response.text


def test_change_user_password(
    make_user, auth_api_client: AuthTestClient, random_string
):
    user = make_user(username="Karl")

    data = {"userId": str(user.id), "password": random_string}

    response = auth_api_client.post(f"/users/{user.id}/change-password", json=data)

    assert response.status_code == 200, response.text
    stmt = select(orm.User).where(orm.User.id == user.id)
    with Session() as s:
        db_user = s.execute(stmt).scalar()

    assert verify_password(random_string, db_user.password)


def test_users_paginated_result__9_items_first_page(
    make_user, auth_api_client: AuthTestClient
):
    # keep in mind that there are actually 9 users, not 8
    # 9th user is the one created for authentication i.e.
    # the one currently being authenticated
    total_users = 8
    for i in range(total_users):
        make_user(username=f"user {i}")

    params = {"page_size": 5, "page_number": 1}
    response = auth_api_client.get("/users/", params=params)

    assert response.status_code == 200, response.json()

    paginated_items = schema.PaginatedResponse[schema.User](**response.json())

    assert paginated_items.page_size == 5
    assert paginated_items.page_number == 1
    assert paginated_items.num_pages == 2
    assert len(paginated_items.items) == 5
