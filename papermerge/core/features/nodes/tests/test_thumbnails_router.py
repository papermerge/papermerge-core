import uuid

from papermerge.core.tests.types import AuthTestClient, TestClient


def test_thumbnails_router(
    auth_api_client: AuthTestClient, make_document_with_pages, user
):
    doc = make_document_with_pages(
        title="brief.pdf", parent=user.home_folder, user=user
    )
    response = auth_api_client.get(f"/thumbnails/{doc.id}")

    assert response.status_code == 200


def test_thumbnails_router_no_auth(
    api_client: TestClient, make_document_with_pages, user
):
    """route must be accessible only when user credentials are present

    `api_client` is plain HTTP client, without any user related info
    """
    doc = make_document_with_pages(
        title="brief.pdf", parent=user.home_folder, user=user
    )
    response = api_client.get(f"/thumbnails/{doc.id}")

    assert response.status_code == 401


def test_thumbnails_router_invalid_document_id(auth_api_client: AuthTestClient):
    # as there are no documents in DB
    # any ID should result 404
    doc_id = uuid.uuid4()
    response = auth_api_client.get(f"/thumbnails/{doc_id}")

    assert response.status_code == 404
