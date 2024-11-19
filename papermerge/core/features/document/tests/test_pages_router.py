from sqlalchemy import select

from papermerge.core import orm, schema, dbapi
from papermerge.core.tests.resource_file import ResourceFile


def test_get_document_details(
    auth_api_client, make_document_from_resource, user, db_session
):
    doc = make_document_from_resource(
        resource=ResourceFile.THREE_PAGES, user=user, parent=user.home_folder
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
    auth_api_client, user, db_session, make_document_from_resource
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


def test_router_extract_all_pages(
    auth_api_client, user, db_session, make_document_from_resource, make_folder
):
    src = make_document_from_resource(
        resource=ResourceFile.LIVING_THINGS, user=user, parent=user.home_folder
    )
    folder = make_folder(title="Target folder", user=user, parent=user.home_folder)

    src_ver = dbapi.get_last_doc_ver(db_session, doc_id=src.id, user_id=user.id)
    src_page_ids = [str(p.id) for p in src_ver.pages]

    data = {
        "source_page_ids": src_page_ids,
        "target_folder_id": str(folder.id),
        "strategy": schema.ExtractStrategy.ONE_PAGE_PER_DOC.value,
        "title_format": "whatever",
    }

    response = auth_api_client.post(f"/pages/extract/", json=data)

    assert response.status_code == 200, response.json()
