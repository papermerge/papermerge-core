import io
import os
from pathlib import Path

from sqlalchemy import select

from papermerge.core import orm
from papermerge.core.constants import ContentType
from papermerge.core.features.document.db import api as dbapi
from papermerge.test.types import AuthTestClient

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
