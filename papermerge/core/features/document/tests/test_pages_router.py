import io
import os
from pathlib import Path

from pydantic.v1.schema import schema
from sqlalchemy import select

from papermerge.core import orm, schema, dbapi
from papermerge.core.constants import ContentType
from papermerge.core.tests.types import AuthTestClient
from papermerge.core.tests.resource_file import ResourceFile


DIR_ABS_PATH = os.path.abspath(os.path.dirname(__file__))
RESOURCES = Path(DIR_ABS_PATH) / "resources"


def test_get_document_details(
    auth_api_client: AuthTestClient, make_document, user, db_session
):
    doc = make_document(title="invoice.pdf", user=user, parent=user.home_folder)

    PDF_PATH = RESOURCES / "three-pages.pdf"

    with open(PDF_PATH, "rb") as file:
        content = file.read()
        size = os.stat(PDF_PATH).st_size
        dbapi.upload(
            db_session=db_session,
            document_id=doc.id,
            content=io.BytesIO(content),
            file_name="three-pages.pdf",
            size=size,
            content_type=ContentType.APPLICATION_PDF,
        )

    stmt = (
        select(orm.Page)
        .join(orm.DocumentVersion)
        .join(orm.Document)
        .where(orm.Document.id == doc.id)
    )
    pages = db_session.execute(stmt).scalars().all()

    response = auth_api_client.get(f"/pages/{pages[0].id}/jpg")
    assert response.status_code == 200, response.json()

    response = auth_api_client.get(f"/pages/{pages[1].id}/jpg")
    assert response.status_code == 200, response.json()

    response = auth_api_client.get(f"/pages/{pages[2].id}/jpg")
    assert response.status_code == 200, response.json()


def test_router_move_pages_endpoint_one_single_page_mix(
    auth_api_client: AuthTestClient, user, db_session, make_document_from_resource
):
    src = make_document_from_resource(
        resource=ResourceFile.LIVING_THINGS, user=user, parent=user.home_folder
    )
    dst = make_document_from_resource(
        resource=ResourceFile.D3_PDF, user=user, parent=user.home_folder
    )

    src_ver = dbapi.get_last_doc_ver(db_session, doc_id=src.id, user_id=user.id)
    src_page = src_ver.pages[1]

    dst_ver = dbapi.get_last_doc_ver(db_session, doc_id=dst.id, user_id=user.id)
    dst_page = dst_ver.pages[0]

    data = {
        "source_page_ids": [str(src_page.id)],
        "target_page_id": str(dst_page.id),
        "move_strategy": schema.MoveStrategy.MIX.value,
    }

    response = auth_api_client.post(f"/pages/move/", json=data)

    assert response.status_code == 200, response.json()
