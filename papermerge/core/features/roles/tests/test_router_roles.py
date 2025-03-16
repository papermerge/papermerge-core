from sqlalchemy import func

from papermerge.core import schema, db, dbapi
from papermerge.core.features.roles.db import orm
from papermerge.core.tests.types import AuthTestClient


def test_creating_role_when_no_perms_are_in_sys(
    auth_api_client: AuthTestClient, db_session: db.Session
):
    """If user attempts to create a role when there are
    no permissions in the system (e.g. permissions were not synced),
    then role creation should fail"""
    response = auth_api_client.post(
        "/roles/",
        json={"name": "Admin", "scopes": []},
    )

    assert response.status_code == 500, response.json()


def test_create_role_route(auth_api_client: AuthTestClient, db_session: db.Session):
    dbapi.sync_perms(db_session)
    count_before = db_session.query(func.count(orm.Role.id)).scalar()
    assert count_before == 0

    response = auth_api_client.post(
        "/roles/",
        json={"name": "Admin", "scopes": []},
    )

    assert response.status_code == 201, response.json()
    count_after = db_session.query(func.count(orm.Role.id)).scalar()
    assert count_after == 1


def test_update_role_route(auth_api_client: AuthTestClient, make_role, db_session):
    role = make_role(name="demo")

    dbapi.sync_perms(db_session)
    response = auth_api_client.patch(
        f"/roles/{role.id}",
        json={"name": "Admin", "scopes": ["user.view", "custom_field.view"]},
    )

    assert response.status_code == 200, response.json()

    updated_role = dbapi.get_role(db_session, role_id=role.id)

    assert set(updated_role.scopes) == {"user.view", "custom_field.view"}


def test_get_role_details(
    make_role, auth_api_client: AuthTestClient, db_session: db.Session
):
    role = make_role(name="demo")

    response = auth_api_client.get(f"/roles/{role.id}")

    assert response.status_code == 200, response.json()


def test_pagination_role_route_basic(auth_api_client: AuthTestClient):
    params = {"page_number": 1, "page_size": 1}
    response = auth_api_client.get("/roles/", params=params)

    assert response.status_code == 200, response.json()


def test_roles_paginated_result__8_items_first_page(
    make_role, auth_api_client: AuthTestClient
):
    total_roles = 8
    for i in range(total_roles):
        make_role(name=f"Role {i}")

    params = {"page_size": 5, "page_number": 1}
    response = auth_api_client.get("/roles/", params=params)

    assert response.status_code == 200, response.json()

    paginated_items = schema.PaginatedResponse[schema.Role](**response.json())

    assert paginated_items.page_size == 5
    assert paginated_items.page_number == 1
    assert paginated_items.num_pages == 2
    assert len(paginated_items.items) == 5


def test_roles_paginated_result__8_items_second_page(
    make_role, auth_api_client: AuthTestClient
):
    total_roles = 8
    for i in range(total_roles):
        make_role(name=f"Role {i}")

    params = {"page_size": 5, "page_number": 2}
    response = auth_api_client.get("/roles/", params=params)

    assert response.status_code == 200, response.json()

    paginated_items = schema.PaginatedResponse[schema.Role](**response.json())

    assert paginated_items.page_size == 5
    assert paginated_items.page_number == 2
    assert paginated_items.num_pages == 2
    # 8 - 3 = 5 (total items = 8, minus items on first page)
    assert len(paginated_items.items) == 3


def test_roles_paginated_result__8_items_4th_page(
    make_role, auth_api_client: AuthTestClient
):
    total_roles = 8
    for i in range(total_roles):
        make_role(name=f"Role {i}")

    params = {"page_size": 5, "page_number": 4}
    response = auth_api_client.get("/roles/", params=params)

    assert response.status_code == 200, response.json()

    paginated_items = schema.PaginatedResponse[schema.Role](**response.json())

    assert paginated_items.page_size == 5
    assert paginated_items.page_number == 4
    assert paginated_items.num_pages == 2
    assert len(paginated_items.items) == 0


def test_roles_list_without_pagination(make_role, auth_api_client: AuthTestClient):
    total_roles = 8
    for i in range(total_roles):
        make_role(name=f"Role {i}")

    response = auth_api_client.get("/roles/all")

    assert response.status_code == 200, response.json()

    items = [schema.Role(**kw) for kw in response.json()]

    assert len(items) == 8
