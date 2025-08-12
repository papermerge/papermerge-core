import os
import uuid
from pathlib import Path
from sqlalchemy.ext.asyncio import AsyncSession

from papermerge.core import dbapi, schema
from papermerge.core.tests.resource_file import ResourceFile

DIR_ABS_PATH = os.path.abspath(os.path.dirname(__file__))
RESOURCES = Path(DIR_ABS_PATH) / "resources"


async def test_download_document_version(
    auth_api_client, make_document_from_resource, user, db_session: AsyncSession
):
    doc = await make_document_from_resource(
        resource=ResourceFile.THREE_PAGES, user=user, parent=user.home_folder
    )

    last_ver = await dbapi.get_last_doc_ver(db_session, doc_id=doc.id)

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
