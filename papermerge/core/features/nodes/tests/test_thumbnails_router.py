import uuid

from papermerge.core.tests.types import AuthTestClient, TestClient


async def test_thumbnails_router(
    auth_api_client: AuthTestClient, make_document_with_pages, user
):
    doc = await make_document_with_pages(
        title="brief.pdf", parent=user.home_folder, user=user
    )
    response = await auth_api_client.get(f"/thumbnails/{doc.id}")

    assert response.status_code == 200


async def test_thumbnails_router_no_auth(
    api_client, make_document_with_pages, user
):
    """route must be accessible only when user credentials are present

    `api_client` is plain HTTP client, without any user related info
    """
    doc = await make_document_with_pages(
        title="brief.pdf", parent=user.home_folder, user=user
    )
    response = await api_client.get(f"/thumbnails/{doc.id}")

    assert response.status_code == 401
