from sqlalchemy import select

from papermerge.core import orm, schema, dbapi
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


def test_1_get_document_last_version__paginated(
    auth_api_client, make_document_from_resource, user
):
    doc = make_document_from_resource(
        resource=ResourceFile.THREE_PAGES, user=user, parent=user.home_folder
    )
    response = auth_api_client.get(f"/documents/{doc.id}/last-version/pages/")

    resp = schema.PaginatedDocVer.model_validate(response.json())
    assert response.status_code == 200, resp
    assert len(resp.pages) == 3, resp


def test_2_get_document_last_version__paginated(
    auth_api_client, make_document_from_resource, user
):
    doc = make_document_from_resource(
        resource=ResourceFile.THREE_PAGES, user=user, parent=user.home_folder
    )
    params = {"page_size": 2, "page_number": 1}
    response = auth_api_client.get(
        f"/documents/{doc.id}/last-version/pages/", params=params
    )

    assert response.status_code == 200, response.json()
    resp = schema.PaginatedDocVer.model_validate(response.json())
    assert len(resp.pages) == 2, resp
    assert resp.num_pages == 2, resp


def test_get_doc_versions_list_one_doc(auth_api_client, make_document, user):
    doc = make_document(title="basic.pdf", user=user, parent=user.home_folder)

    resp = auth_api_client.get(f"/documents/{doc.id}/versions/")
    assert resp.status_code == 200, resp.json()

    data = resp.json()

    vers = [schema.DocVerListItem.model_validate(ver) for ver in data]

    assert len(vers) == 1, data
    assert vers[0].number == 1, data


def test_get_doc_versions_list_two_docs(
    auth_api_client, make_document, user, db_session
):
    doc = make_document(title="basic.pdf", user=user, parent=user.home_folder)
    dbapi.version_bump(db_session, doc_id=doc.id, user_id=user.id, page_count=3)

    resp = auth_api_client.get(f"/documents/{doc.id}/versions/")
    assert resp.status_code == 200, resp.json()

    data = resp.json()

    vers = [schema.DocVerListItem.model_validate(ver) for ver in data]

    assert len(vers) == 2, data
    assert vers[0].number == 2, data
    assert vers[1].number == 1, data
