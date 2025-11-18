from core.tests.types import AuthTestClient


async def test_search_with_empty_categories_filter(
    auth_api_client: AuthTestClient
):
    payload = {
        "filters": {
            "categories":[
                {"values":[],"operator":"any"}
            ],
        },
        "page_number": 1,
        "page_size": 25
    }

    response = await auth_api_client.post(
        f"/search/",
        json=payload,
    )

    assert response.status_code == 200, response.json()


async def test_search_with_empty_tags_filter(
    auth_api_client: AuthTestClient
):
    payload = {
        "filters": {
            "tags":[
                {"values":[],"operator":"any"}
            ],
        },
        "page_number": 1,
        "page_size": 25
    }

    response = await auth_api_client.post(
        f"/search/",
        json=payload,
    )

    assert response.status_code == 200, response.json()
