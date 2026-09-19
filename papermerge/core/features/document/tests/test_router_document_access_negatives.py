import os
import uuid
from pathlib import Path

from papermerge.core import dbapi

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
    uid = str(uuid.uuid4())
    payload = {
        uid: "some-value"
    }

    response = await user_b_api_client.patch(
        f"/documents/{doc.id}/custom-fields/values/bulk", json=payload
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
    user_a = await make_user("user_a", is_superuser=True)
    user_b = await make_user("user_b", is_superuser=True)
    doc_type = await make_document_type(name="ZDF", path_template="/home/", user=user_a)
    doc = await make_document("doc.pdf", parent=user_a.home_folder, user=user_a)

    user_b_api_client = await login_as(user_b)

    response = await user_b_api_client.patch(
        f"/documents/{doc.id}/type", json={"document_type_id": str(doc_type.id)}
    )

    assert response.status_code == 403


async def test_apply_page_operations_unauthorized(
    make_user, make_document, login_as, db_session
):
    """User B should not be able to apply page operations on User A's doc"""
    user_a = await make_user("user_a", is_superuser=True)
    user_b = await make_user("user_b", is_superuser=True)
    doc_a = await make_document("doc_a.pdf", parent=user_a.home_folder, user=user_a)
    await dbapi.version_bump(db_session, doc_id=doc_a.id, user_id=user_a.id, page_count=3)
    doc_ver_a = await dbapi.get_last_doc_ver(db_session, doc_id=doc_a.id)

    user_b_api_client = await login_as(user_b)
    payload = [
        {"page": {"id": str(doc_ver_a.pages[0].id), "number": 1}, "angle": 90}
    ]

    response = await user_b_api_client.post("/pages/", json=payload)
    assert response.status_code == 403


async def test_move_pages_unauthorized(
    make_user, make_document, login_as, db_session
):
    """User B should not be able to move pages from User A's doc"""
    user_a = await make_user("user_a", is_superuser=True)
    user_b = await make_user("user_b", is_superuser=True)
    doc_a = await make_document("doc_a.pdf", parent=user_a.home_folder, user=user_a)
    doc_b = await make_document("doc_b.pdf", parent=user_b.home_folder, user=user_b)
    await dbapi.version_bump(db_session, doc_id=doc_a.id, user_id=user_a.id, page_count=3)
    await dbapi.version_bump(db_session, doc_id=doc_b.id, user_id=user_b.id, page_count=3)
    doc_ver_a = await dbapi.get_last_doc_ver(db_session, doc_id=doc_a.id)
    doc_ver_b = await dbapi.get_last_doc_ver(db_session, doc_id=doc_b.id)

    user_b_api_client = await login_as(user_b)
    payload = {
        "source_page_ids": [str(doc_ver_a.pages[0].id)],
        "target_page_id": str(doc_ver_b.pages[0].id),
        "move_strategy": "mix",
    }

    response = await user_b_api_client.post("/pages/move", json=payload)
    assert response.status_code == 403


async def test_extract_pages_unauthorized(
    make_user, make_document, login_as, db_session
):
    """User B should not be able to extract pages from User A's doc"""
    user_a = await make_user("user_a", is_superuser=True)
    user_b = await make_user("user_b", is_superuser=True)
    doc_a = await make_document("doc_a.pdf", parent=user_a.home_folder, user=user_a)
    await dbapi.version_bump(db_session, doc_id=doc_a.id, user_id=user_a.id, page_count=3)
    doc_ver_a = await dbapi.get_last_doc_ver(db_session, doc_id=doc_a.id)

    user_b_api_client = await login_as(user_b)
    payload = {
        "source_page_ids": [str(doc_ver_a.pages[0].id)],
        "target_folder_id": str(user_b.home_folder_id),
        "strategy": "one-page-per-doc",
        "title_format": "ext",
    }

    response = await user_b_api_client.post("/pages/extract", json=payload)
    assert response.status_code == 403


async def test_start_ocr_unauthorized(
    make_user, make_document, login_as
):
    """User B should not be able to trigger OCR on User A's doc"""
    user_a = await make_user("user_a", is_superuser=True)
    user_b = await make_user("user_b", is_superuser=True)
    doc_a = await make_document("doc_a.pdf", parent=user_a.home_folder, user=user_a)

    user_b_api_client = await login_as(user_b)
    payload = {
        "document_id": str(doc_a.id),
        "lang": "eng",
    }

    response = await user_b_api_client.post("/tasks/ocr", json=payload)
    assert response.status_code == 403


async def test_start_ocr_authorized(
    make_user, make_document, login_as
):
    """User A should be able to trigger OCR on User A's own doc"""
    user_a = await make_user("user_a", is_superuser=True)
    doc_a = await make_document("doc_a.pdf", parent=user_a.home_folder, user=user_a)

    user_a_api_client = await login_as(user_a)
    payload = {
        "document_id": str(doc_a.id),
        "lang": "eng",
    }

    response = await user_a_api_client.post("/tasks/ocr", json=payload)
    assert response.status_code == 200
