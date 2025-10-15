from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from papermerge.core import orm, schema, dbapi
from papermerge.core.tests.resource_file import ResourceFile


async def test_get_document_details(
    auth_api_client, make_document_from_resource, user, db_session: AsyncSession
):
    doc = await make_document_from_resource(
        resource=ResourceFile.THREE_PAGES, user=user, parent=user.home_folder
    )

    response = await auth_api_client.get(f"/documents/{doc.id}")
    assert response.status_code == 200, response.json()


async def test_update_document_type(
    auth_api_client,
    make_document,
    user,
    make_document_type,
    db_session: AsyncSession
):
    doc = await make_document(title="document.pdf", user=user, parent=user.home_folder)
    dt1: orm.DocumentType = await make_document_type(name="dt1", user=user)
    data = {"document_type_id": str(dt1.id)}

    response = await auth_api_client.patch(f"/documents/{doc.id}/type", json=data)

    assert response.status_code == 200, response.json()

    fresh_doc = (await db_session.execute(
        select(orm.Document).where(orm.Document.id == doc.id)
    )).scalar()

    assert fresh_doc.document_type == dt1


async def test_get_documents_by_type(
    auth_api_client,
    make_document,
    user,
    make_document_type,
    db_session: AsyncSession
):
    doc = await make_document(title="document.pdf", user=user, parent=user.home_folder)
    type: orm.DocumentType = await make_document_type(name="dt1", user=user)


    response = await auth_api_client.get(f"/documents/type/{type.id}")

    assert response.status_code == 200, response.json()



async def test_get_document_custom_fields_values(
    auth_api_client, make_document_receipt, user
):
    doc = await make_document_receipt(title="document.pdf", user=user)

    response = await auth_api_client.get(f"/documents/{doc.id}/custom-fields")

    assert response.status_code == 200, response.json()


async def test_get_doc_versions_list_one_doc(auth_api_client, make_document, user):
    doc = await make_document(title="basic.pdf", user=user, parent=user.home_folder)

    resp = await auth_api_client.get(f"/documents/{doc.id}/versions")
    assert resp.status_code == 200, resp.json()

    data = resp.json()

    vers = [schema.DocVerListItem.model_validate(ver) for ver in data]

    assert len(vers) == 1, data
    assert vers[0].number == 1, data


async def test_get_doc_versions_list_two_docs(
    auth_api_client, make_document, user, db_session: AsyncSession
):
    doc = await make_document(title="basic.pdf", user=user, parent=user.home_folder)
    await dbapi.version_bump(db_session, doc_id=doc.id, user_id=user.id, page_count=3)

    resp = await auth_api_client.get(f"/documents/{doc.id}/versions")
    assert resp.status_code == 200, resp.json()

    data = resp.json()

    vers = [schema.DocVerListItem.model_validate(ver) for ver in data]

    assert len(vers) == 2, data
    assert vers[0].number == 2, data
    assert vers[1].number == 1, data
