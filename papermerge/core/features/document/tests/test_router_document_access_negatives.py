import os
from pathlib import Path

from papermerge.core.features.document import schema

DIR_ABS_PATH = os.path.abspath(os.path.dirname(__file__))
RESOURCES = Path(DIR_ABS_PATH) / "resources"


async def test_update_cf(make_user, make_document, login_as):
    """
    User B should not be able to update user's A private docs cf
    """
    user_a = await make_user("user_a", is_superuser=True)
    user_b = await make_user("user_b", is_superuser=True)
    doc = await make_document("doc.pdf", parent=user_a.home_folder, user=user_a)

    user_b_api_client = await login_as(user_b)
    payload = [
        schema.DocumentCustomFieldsUpdate(key="asn", value="D123354").model_dump()
    ]

    response = await user_b_api_client.patch(
        f"/documents/{doc.id}/custom-fields", json=payload
    )

    assert response.status_code == 403, response.json()


async def test_get_cf(make_user, make_document, login_as):
    """
    User B should not be able to get user's A private docs cf
    """
    user_a = await make_user("user_a", is_superuser=True)
    user_b = await make_user("user_b", is_superuser=True)
    doc = await make_document("doc.pdf", parent=user_a.home_folder, user=user_a)

    user_b_api_client = await login_as(user_b)

    response = await user_b_api_client.get(f"/documents/{doc.id}/custom-fields")

    assert response.status_code == 403, response.json()


async def test_upload_file(make_user, make_document, login_as):
    """
    User B should not be able to upload file in user's A private docs
    """
    user_a = await make_user("user_a", is_superuser=True)
    user_b = await make_user("user_b", is_superuser=True)
    doc = await make_document("doc.pdf", parent=user_a.home_folder, user=user_a)

    user_b_api_client = await login_as(user_b)

    pdf_path = RESOURCES / "three-pages.pdf"
    with open(pdf_path, "rb") as file:
        file_content = file.read()

    response = await user_b_api_client.post(
        f"/documents/{doc.id}/upload",
        files={"file": ("test.pdf", file_content, "application/pdf")},
    )

    assert response.status_code == 403, response.json()


async def test_get_document_details(make_user, make_document, login_as):
    """
    User B should not be able to retrieve details of user's A private doc
    """
    user_a = await make_user("user_a", is_superuser=True)
    user_b = await make_user("user_b", is_superuser=True)
    doc = await make_document("doc.pdf", parent=user_a.home_folder, user=user_a)

    user_b_api_client = await login_as(user_b)

    response = await user_b_api_client.get(f"/documents/{doc.id}")

    assert response.status_code == 403, response.json()


async def test_update_document_type(make_user, make_document_type, make_document, login_as):
    """
    User B should not be able to update document type of user's A private doc
    """
    doc_type = await make_document_type(name="ZDF", path_template="/home/")
    user_a = await make_user("user_a", is_superuser=True)
    user_b = await make_user("user_b", is_superuser=True)
    doc = await make_document("doc.pdf", parent=user_a.home_folder, user=user_a)

    user_b_api_client = await login_as(user_b)

    response = await user_b_api_client.patch(
        f"/documents/{doc.id}/type", json={"document_type_id": str(doc_type.id)}
    )

    assert response.status_code == 403
