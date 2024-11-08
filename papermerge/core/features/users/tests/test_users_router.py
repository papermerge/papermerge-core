from papermerge.core import schema
from papermerge.test.types import AuthTestClient


def test_list_users(make_user, auth_api_client: AuthTestClient):
    for i in range(3):
        make_user(username=f"user {i}")

    response = auth_api_client.get("/users/")

    assert response.status_code == 200, response.json()


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
