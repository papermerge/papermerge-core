from freezegun import freeze_time

from papermerge.core.db import AsyncSession
from papermerge.core.tests.types import AuthTestClient


async def test_very_basic_created_at(
    auth_api_client: AuthTestClient,
    db_session: AsyncSession,
    user,
    make_document
):
    with freeze_time("2025-12-16"):
        doc_1 = await make_document(
            title="newer.pdf",
            user=user,
            parent=user.home_folder,
        )

    with freeze_time("2025-12-01"):
        doc_2 = await make_document(
            title="older.pdf",
            user=user,
            parent=user.home_folder,
        )

    payload = {
        "filters": {
            "created_at": [
                {
                    "operator": "gt",
                    "value": "2025-12-10"
                }
            ]
        },
        "page_number": 1,
        "page_size": 25
    }

    response = await auth_api_client.post("/search/", json=payload)

    assert response.status_code == 200, response.json()
    result = response.json()

    assert "items" in result
    returned_titles = {item["title"] for item in result["items"]}
    assert len(result["items"]) == 1
    assert "newer.pdf" in returned_titles, "newer.pdf should be found"
