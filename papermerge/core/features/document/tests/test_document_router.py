from sqlalchemy import select


from papermerge.core import orm
from papermerge.core.tests.resource_file import ResourceFile


def test_get_document_details(
    auth_api_client, make_document_from_resource, user, db_session
):
    doc = make_document_from_resource(
        resource=ResourceFile.THREE_PAGES, user=user, parent=user.home_folder
    )

    response = auth_api_client.get(f"/documents/{doc.id}")
    assert response.status_code == 200, response.json()


def test_update_document_type(
    auth_api_client, make_document, user, make_document_type, db_session
):
    doc = make_document(title="document.pdf", user=user, parent=user.home_folder)
    dt1: orm.DocumentType = make_document_type(name="dt1")
    data = {"document_type_id": str(dt1.id)}

    response = auth_api_client.patch(f"/documents/{doc.id}/type", json=data)

    assert response.status_code == 200, response.json()

    fresh_doc = db_session.execute(
        select(orm.Document).where(orm.Document.id == doc.id)
    ).scalar()

    assert fresh_doc.document_type == dt1


def test_get_document_custom_fields_values(
    auth_api_client, make_document_receipt, user
):
    doc = make_document_receipt(title="document.pdf", user=user)

    response = auth_api_client.get(f"/documents/{doc.id}/custom-fields")

    assert response.status_code == 200, response.json()
