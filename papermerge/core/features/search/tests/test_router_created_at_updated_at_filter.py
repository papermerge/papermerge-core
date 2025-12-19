from freezegun import freeze_time

from papermerge.core.features.document.schema import DocumentLang
from papermerge.core import db
from papermerge.core.tests.types import AuthTestClient


async def test_very_basic_created_at(
    auth_api_client: AuthTestClient,
    db_session: db.AsyncSession,
    user,
    make_document
):
    with freeze_time("2025-12-16"):
        await make_document(
            title="newer.pdf",
            user=user,
            parent=user.home_folder,
        )

    with freeze_time("2025-12-01"):
        await make_document(
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


async def test_created_at_1_second_difference(
    auth_api_client: AuthTestClient,
    db_session: db.AsyncSession,
    user,
    make_document
):
    with freeze_time("2025-12-16T13:43:03Z"):
        await make_document(
            title="newer.pdf",
            user=user,
            parent=user.home_folder,
        )

    with freeze_time("2025-12-16T13:43:02Z"):
        await make_document(
            title="older.pdf",
            user=user,
            parent=user.home_folder,
        )

    payload = {
        "filters": {
            "created_at": [
                {
                    "operator": "gt",
                    "value": "2025-12-16T13:43:02Z"
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


async def test_updated_at_1_microsecond_diff(
    auth_api_client: AuthTestClient,
    db_session: db.AsyncSession,
    user,
    make_document
):
    with freeze_time("2025-12-16T13:43:03Z"):
        doc1 = await make_document(
            title="newer.pdf",
            user=user,
            parent=user.home_folder,
            lang=DocumentLang.deu
        )
        doc2 = await make_document(
            title="older.pdf",
            user=user,
            parent=user.home_folder,
            lang=DocumentLang.deu
        )

    with freeze_time("2025-12-16T14:00:00.002Z"):
        doc1_ver = await db.get_last_doc_ver(db_session=db_session, doc_id=doc1.id)
        await db.set_doc_ver_lang(
            db_session=db_session,
            doc_ver_id=doc1_ver.id,
            lang=DocumentLang.spa,
        )

    with freeze_time("2025-12-16T14:00:00.001Z"):
        doc2_ver = await db.get_last_doc_ver(db_session=db_session, doc_id=doc2.id)
        await db.set_doc_ver_lang(
            db_session=db_session,
            doc_ver_id=doc2_ver.id,
            lang=DocumentLang.spa,
        )

    payload = {
        "filters": {
            "updated_at": [
                {
                    "operator": "gt",
                    "value": "2025-12-16T14:00:00.001Z"
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
