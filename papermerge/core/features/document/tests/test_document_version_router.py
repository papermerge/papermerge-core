import os
import uuid
from pathlib import Path

from papermerge.core import dbapi
from papermerge.core.tests.resource_file import ResourceFile


DIR_ABS_PATH = os.path.abspath(os.path.dirname(__file__))
RESOURCES = Path(DIR_ABS_PATH) / "resources"


def test_download_document_version(
    auth_api_client, make_document_from_resource, user, db_session
):
    doc = make_document_from_resource(
        resource=ResourceFile.THREE_PAGES, user=user, parent=user.home_folder
    )

    last_ver = dbapi.get_last_doc_ver(db_session, doc_id=doc.id, user_id=user.id)

    response = auth_api_client.get(f"/document-versions/{last_ver.id}/download")
    assert response.status_code == 200


def test_document_version_download_request_non_existing_resource(auth_api_client):
    non_existing_resource_id = uuid.uuid4().hex
    response = auth_api_client.get(
        f"/document-versions/{non_existing_resource_id}/download"
    )
    assert response.status_code == 404


def test_document_version_details_request_non_existing_resource(auth_api_client):
    non_existing_resource_id = uuid.uuid4().hex
    response = auth_api_client.get(f"/document-versions/{non_existing_resource_id}")
    assert response.status_code == 404
