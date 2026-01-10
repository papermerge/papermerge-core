import os
import uuid
from pathlib import Path

from sqlalchemy.ext.asyncio import AsyncSession

from papermerge.core import dbapi, schema
from papermerge.core.tests.types import AuthTestClient, DocumentTestFileType
from papermerge.core.tests.resource_file import ResourceFile

DIR_ABS_PATH = os.path.abspath(os.path.dirname(__file__))
RESOURCES = Path(DIR_ABS_PATH) / "resources"


async def test_download_document_version(
    auth_api_client,
    make_document_from_resource,
    user,
    db_session: AsyncSession,
    pdf_file: DocumentTestFileType
):
    resp = await auth_api_client.post(
        "/documents/upload",
        files={"file": pdf_file.as_upload_tuple()}
    )
    assert resp.status_code == 201, resp.json()
    data = resp.json()

    last_ver = await dbapi.get_last_doc_ver(db_session, doc_id=data['id'])
    response = await auth_api_client.get(f"/document-versions/{last_ver.id}/download")
    assert response.status_code == 200


async def test_document_version_download_request_non_existing_resource(auth_api_client):
    non_existing_resource_id = uuid.uuid4().hex
    response = await auth_api_client.get(
        f"/document-versions/{non_existing_resource_id}/download"
    )
    assert response.status_code == 403


async def test_document_version_details_request_non_existing_resource(auth_api_client):
    non_existing_resource_id = uuid.uuid4().hex
    response = await auth_api_client.get(f"/document-versions/{non_existing_resource_id}")
    assert response.status_code == 403


async def test_get_doc_ver_download_url(
    auth_api_client, make_document_from_resource, user, db_session: AsyncSession
):
    doc = await make_document_from_resource(
        resource=ResourceFile.THREE_PAGES, user=user, parent=user.home_folder
    )

    last_ver = await dbapi.get_last_doc_ver(db_session, doc_id=doc.id)

    response = await auth_api_client.get(f"/document-versions/{last_ver.id}/download-url")

    assert response.status_code == 200
    data = schema.DownloadURL(**response.json())
    assert str(last_ver.id) in data.downloadURL


async def test_get_doc_ver_lang(
    auth_api_client: AuthTestClient,
    make_document_version,
    user,
    db_session: AsyncSession
):
    """Test getting lang attribute of a document version"""
    doc_ver = await make_document_version(page_count=2, lang="fra", user=user)

    response = await auth_api_client.get(f"/document-versions/{doc_ver.id}/lang")

    assert response.status_code == 200, response.json()
    data = response.json()
    assert data["lang"] == "fra"


async def test_get_doc_ver_lang_default(
    auth_api_client: AuthTestClient,
    make_document_version,
    user,
    db_session: AsyncSession
):
    """Test getting lang attribute when default value is used"""
    # Default lang is "deu" when not specified
    doc_ver = await make_document_version(page_count=1, user=user)

    response = await auth_api_client.get(f"/document-versions/{doc_ver.id}/lang")

    assert response.status_code == 200, response.json()
    data = response.json()
    assert data["lang"] == "deu"


async def test_get_doc_ver_lang_non_existing(
    auth_api_client: AuthTestClient,
):
    """Test getting lang attribute for non-existing document version returns 403"""
    non_existing_id = uuid.uuid4()

    response = await auth_api_client.get(f"/document-versions/{non_existing_id}/lang")

    # 403 because permission check fails first (can't check permission on non-existing resource)
    assert response.status_code == 403, response.json()


async def test_set_doc_ver_lang(
    auth_api_client: AuthTestClient,
    make_document_version,
    user,
    pdf_file: DocumentTestFileType,
    db_session: AsyncSession
):
    """Test setting lang attribute of a document version"""
    doc_ver = await make_document_version(page_count=2, lang="deu", user=user)

    response = await auth_api_client.patch(
        f"/document-versions/{doc_ver.id}/lang",
        json={"lang": "eng"}
    )

    assert response.status_code == 200, response.json()
    data = response.json()
    assert data["lang"] == "eng"


async def test_set_doc_ver_lang_verify_persistence(
    auth_api_client: AuthTestClient,
    make_document_version,
    user,
    db_session: AsyncSession
):
    """Test that setting lang attribute persists the change"""
    doc_ver = await make_document_version(page_count=2, lang="deu", user=user)

    # Set the lang
    await auth_api_client.patch(
        f"/document-versions/{doc_ver.id}/lang",
        json={"lang": "ron"}
    )

    # Verify by getting it again
    response = await auth_api_client.get(f"/document-versions/{doc_ver.id}/lang")

    assert response.status_code == 200, response.json()
    data = response.json()
    assert data["lang"] == "ron"


async def test_set_doc_ver_lang_non_existing(
    auth_api_client: AuthTestClient,
):
    """Test setting lang attribute for non-existing document version returns 403"""
    non_existing_id = uuid.uuid4()

    response = await auth_api_client.patch(
        f"/document-versions/{non_existing_id}/lang",
        json={"lang": "eng"}
    )

    # 403 because permission check fails first
    assert response.status_code == 403, response.json()


async def test_set_doc_ver_lang_missing_payload(
    auth_api_client: AuthTestClient,
    make_document_version,
    user,
    db_session: AsyncSession
):
    """Test setting lang attribute without payload returns 422"""
    doc_ver = await make_document_version(page_count=1, user=user)

    response = await auth_api_client.patch(
        f"/document-versions/{doc_ver.id}/lang",
        json={}
    )

    assert response.status_code == 422, response.json()


async def test_set_doc_ver_lang_multiple_times(
    auth_api_client: AuthTestClient,
    make_document_version,
    user,
    db_session: AsyncSession
):
    """Test setting lang attribute multiple times"""
    doc_ver = await make_document_version(page_count=1, lang="deu", user=user)

    # Set to eng
    response = await auth_api_client.patch(
        f"/document-versions/{doc_ver.id}/lang",
        json={"lang": "eng"}
    )
    assert response.status_code == 200
    assert response.json()["lang"] == "eng"

    # Set to fra
    response = await auth_api_client.patch(
        f"/document-versions/{doc_ver.id}/lang",
        json={"lang": "fra"}
    )
    assert response.status_code == 200
    assert response.json()["lang"] == "fra"

    # Set to ron
    response = await auth_api_client.patch(
        f"/document-versions/{doc_ver.id}/lang",
        json={"lang": "ron"}
    )
    assert response.status_code == 200
    assert response.json()["lang"] == "ron"

    # Verify final value
    response = await auth_api_client.get(f"/document-versions/{doc_ver.id}/lang")
    assert response.json()["lang"] == "ron"
