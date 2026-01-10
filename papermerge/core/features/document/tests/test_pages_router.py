import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from papermerge.core import schema, dbapi
from papermerge.core.tests.resource_file import ResourceFile


@pytest.mark.skip(reason="Will be moved to worker")
@pytest.mark.asyncio
async def test_router_move_pages_endpoint_one_single_page_mix(
    auth_api_client, user, db_session: AsyncSession, make_document_from_resource
):
    src = await make_document_from_resource(
        resource=ResourceFile.LIVING_THINGS, user=user, parent=user.home_folder
    )
    dst = await make_document_from_resource(
        resource=ResourceFile.D3_PDF, user=user, parent=user.home_folder
    )

    src_ver = await dbapi.get_last_doc_ver(db_session, doc_id=src.id)
    src_page = src_ver.pages[1]

    dst_ver = await dbapi.get_last_doc_ver(db_session, doc_id=dst.id)
    dst_page = dst_ver.pages[0]

    data = {
        "source_page_ids": [str(src_page.id)],
        "target_page_id": str(dst_page.id),
        "move_strategy": schema.MoveStrategy.MIX.value,
    }

    response = await auth_api_client.post(f"/pages/move", json=data)

    assert response.status_code == 200, response.json()


@pytest.mark.skip(reason="Will be moved to worker")
async def test_router_extract_all_pages(
    auth_api_client, user, db_session: AsyncSession, make_document_from_resource, make_folder
):
    src = await make_document_from_resource(
        resource=ResourceFile.LIVING_THINGS, user=user, parent=user.home_folder
    )
    folder = await make_folder(
        title="Target folder",
        user=user,
        parent=user.home_folder
    )

    src_ver = await dbapi.get_last_doc_ver(db_session, doc_id=src.id)
    src_page_ids = [str(p.id) for p in src_ver.pages]

    data = {
        "source_page_ids": src_page_ids,
        "target_folder_id": str(folder.id),
        "strategy": schema.ExtractStrategy.ONE_PAGE_PER_DOC.value,
        "title_format": "whatever",
    }

    response = await auth_api_client.post(f"/pages/extract", json=data)

    assert response.status_code == 200, response.json()
