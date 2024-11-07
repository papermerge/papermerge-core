from papermerge.test.types import AuthTestClient


def test_thumbnails_router(
    auth_api_client: AuthTestClient, make_document_with_pages, user
):
    doc = make_document_with_pages(
        title="brief.pdf", parent=user.home_folder, user=user
    )
    response = auth_api_client.get(
        f"/thumbnails/{doc.id}", headers={"Content-Type": "image/jpeg"}
    )

    assert response.status_code == 200, response.json()
