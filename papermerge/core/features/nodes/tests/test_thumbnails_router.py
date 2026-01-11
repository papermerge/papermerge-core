import pytest

from papermerge.core.tests.types import DocumentTestFileType
from papermerge.core.tests.types import AuthTestClient


@pytest.mark.skip(reason="Do I need this test?")
async def test_thumbnails_router(
    auth_api_client: AuthTestClient,
    make_document_with_pages,
    user,
    pdf_file: DocumentTestFileType
):
    resp = await auth_api_client.post(
        "/documents/upload",
        files={"file": pdf_file.as_upload_tuple()}
    )
    assert resp.status_code == 201, resp.json()
    data = resp.json()

    response = await auth_api_client.get(f"/thumbnails/{data['id']}")

    assert response.status_code == 200


async def test_thumbnails_router_no_auth(
    api_client,
    make_document_with_pages,
    user,
    auth_api_client,
    pdf_file: DocumentTestFileType
):
    """route must be accessible only when user credentials are present

    `api_client` is plain HTTP client, without any user related info
    """
    resp = await auth_api_client.post(
        "/documents/upload",
        files={"file": pdf_file.as_upload_tuple()}
    )
    assert resp.status_code == 201, resp.json()
    data = resp.json()

    response = await api_client.get(f"/thumbnails/{data['id']}")

    assert response.status_code == 401
