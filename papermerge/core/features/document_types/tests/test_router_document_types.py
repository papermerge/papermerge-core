from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from papermerge.core import schema, orm
from papermerge.core.tests.types import AuthTestClient


async def test_create_document_type_with_path_template(
    auth_api_client: AuthTestClient, db_session: AsyncSession
):
    count_before = (await db_session.execute(
        select(func.count(orm.DocumentType.id))
    )).scalar()
    assert count_before == 0

    response = await auth_api_client.post(
        "/document-types/",
        json={
            "name": "Invoice",
            "path_template": "/home/My ZDF/",
            "custom_field_ids": [],
        },
    )
    assert response.status_code == 201, response.json()

    count_after =(
        await db_session.execute(select(func.count(orm.DocumentType.id)))
    ).scalar()
    assert count_after == 1

    document_type = schema.DocumentType.model_validate(response.json())
    assert document_type.name == "Invoice"
    assert document_type.path_template == "/home/My ZDF/"


async def test_update_document_type_with_path_template(
    make_document_type, auth_api_client: AuthTestClient, db_session: AsyncSession
):
    doc_type = await make_document_type(name="ZDF", path_template="/home/")
    response = await auth_api_client.patch(
        f"/document-types/{doc_type.id}",
        json={
            "name": "Invoice",
            "path_template": "/home/My ZDF/updated/",
            "custom_field_ids": [],
        },
    )

    document_type = schema.DocumentType.model_validate(response.json())
    assert document_type.path_template == "/home/My ZDF/updated/"


async def test_create_document_type_owned_by_user(
    make_custom_field, auth_api_client: AuthTestClient, db_session: AsyncSession
):
    cf1: schema.CustomField = await make_custom_field(name="shop", type="text")
    cf2: schema.CustomField = await make_custom_field(name="total", type="monetary")

    count_before = (await db_session.execute(
        select(func.count(orm.DocumentType.id))
    )).scalar()
    assert count_before == 0

    response = await auth_api_client.post(
        "/document-types/",
        json={"name": "Invoice", "custom_field_ids": [str(cf1.id), str(cf2.id)]},
    )

    assert response.status_code == 201, response.json()

    count_after = (await db_session.execute(select(func.count(orm.DocumentType.id)))).scalar()
    assert count_after == 1

    document_type = schema.DocumentType.model_validate(response.json())
    db_document_type = await db_session.get(orm.DocumentType, document_type.id)
    assert document_type.name == "Invoice"
    assert db_document_type.user_id == auth_api_client.user.id
    assert len(document_type.custom_fields) == 2
    assert set([cf.name for cf in document_type.custom_fields]) == {"shop", "total"}


async def test_create_document_type_owned_by_group(
    make_custom_field, auth_api_client: AuthTestClient, db_session: AsyncSession, make_group
):
    """Create a document type owned by the group"""
    group: orm.Group = await make_group("Family", with_special_folders=True)
    cf1: schema.CustomField = await make_custom_field(
        name="shop", type="text", group_id=group.id
    )
    cf2: schema.CustomField = await make_custom_field(
        name="total", type="monetary", group_id=group.id
    )

    count_before = (await db_session.execute(select(func.count(orm.DocumentType.id)))).scalar()
    assert count_before == 0

    response = await auth_api_client.post(
        "/document-types/",
        json={
            "name": "Invoice",
            "custom_field_ids": [str(cf1.id), str(cf2.id)],
            "group_id": str(group.id),
        },
    )

    assert response.status_code == 201, response.json()

    count_after = (await db_session.execute(select(func.count(orm.DocumentType.id)))).scalar()
    assert count_after == 1

    document_type = schema.DocumentType.model_validate(response.json())
    db_document_type = await db_session.get(orm.DocumentType, document_type.id)

    assert document_type.name == "Invoice"
    assert db_document_type.user_id == None
    assert db_document_type.group_id == group.id


async def test_list_document_types(make_document_type, auth_api_client: AuthTestClient):
    await make_document_type(name="Invoice")
    response = await auth_api_client.get("/document-types/")

    assert response.status_code == 200, response.json()


async def test_update_document_type(
    auth_api_client: AuthTestClient,
    db_session: AsyncSession,
    make_document_type,
    make_custom_field,
):
    cf1 = await make_custom_field(name="cf1", type="text")
    cf2 = await make_custom_field(name="cf2", type="boolean")
    doc_type = await make_document_type(name="Invoice")

    response = await auth_api_client.patch(
        f"/document-types/{doc_type.id}",
        json={
            "name": "Invoice-updated",
            "custom_field_ids": [str(cf1.id), str(cf2.id)],
        },
    )
    assert response.status_code == 200
    updated_dtype = schema.DocumentType(**response.json())
    assert updated_dtype.name == "Invoice-updated"
    assert set([cf.name for cf in updated_dtype.custom_fields]) == {"cf1", "cf2"}


async def test_update_group_id_field_in_document_type(
    auth_api_client: AuthTestClient,
    db_session: AsyncSession,
    make_document_type,
    make_group,
):
    """
    Update group_id field of document type.
    DocumentType is owned by user and user can transfer ownership to
    the group.
    """
    doc_type = await make_document_type(name="Invoice")
    group: orm.Group = await make_group("Familly", with_special_folders=True)
    user = auth_api_client.user

    user.groups.append(group)
    await db_session.commit()

    response = await auth_api_client.patch(
        f"/document-types/{doc_type.id}",
        json={
            "group_id": str(group.id),
        },
    )

    result = await db_session.execute(
        select(orm.DocumentType).where(orm.DocumentType.id == doc_type.id)
    )
    fresh_document_type = result.scalar_one()
    assert response.status_code == 200
    assert fresh_document_type.group_id == group.id
    assert fresh_document_type.user_id == None


async def test_delete_document_type(
    auth_api_client: AuthTestClient,
    db_session: AsyncSession,
    make_document_type,
):
    doc_type = await make_document_type(name="Invoice")
    count_before = (await db_session.execute(select(func.count(orm.DocumentType.id)))).scalar()
    assert count_before == 1

    response = await auth_api_client.delete(f"/document-types/{doc_type.id}")
    assert response.status_code == 204, response.json()
    count_after = (await db_session.execute(select(func.count(orm.DocumentType.id)))).scalar()

    assert count_after == 0


async def test_paginated_result__9_items_first_page(
    make_document_type, auth_api_client: AuthTestClient, user
):
    total_doc_type_items = 9
    for i in range(total_doc_type_items):
        await make_document_type(name=f"Invoice {i}", user=user)

    params = {"page_size": 5, "page_number": 1}
    response = await auth_api_client.get("/document-types/", params=params)

    assert response.status_code == 200, response.json()

    paginated_items = schema.PaginatedResponse[schema.DocumentType](**response.json())

    assert paginated_items.page_size == 5
    assert paginated_items.page_number == 1
    assert paginated_items.num_pages == 2
    assert len(paginated_items.items) == 5


async def test_paginated_result__9_items_second_page(
    make_document_type, auth_api_client: AuthTestClient, user
):
    total_doc_type_items = 9
    for i in range(total_doc_type_items):
        await make_document_type(name=f"Invoice {i}", user=user)

    params = {"page_size": 5, "page_number": 2}
    response = await auth_api_client.get("/document-types/", params=params)

    assert response.status_code == 200, response.json()

    paginated_items = schema.PaginatedResponse[schema.DocumentType](**response.json())

    assert paginated_items.page_size == 5
    assert paginated_items.page_number == 2
    assert paginated_items.num_pages == 2
    #  total - items_on_first_page
    #  i.e 10 - 5 = 4
    assert len(paginated_items.items) == 4


async def test_paginated_result__9_items_3rd_page(
    make_document_type, auth_api_client: AuthTestClient, user
):
    total_doc_type_items = 9
    for i in range(total_doc_type_items):
        await make_document_type(name=f"Invoice {i}", user=user)

    params = {"page_size": 5, "page_number": 3}
    response = await auth_api_client.get("/document-types/", params=params)

    assert response.status_code == 200, response.json()

    paginated_items = schema.PaginatedResponse[schema.DocumentType](**response.json())

    assert paginated_items.page_size == 5
    assert paginated_items.page_number == 3
    assert paginated_items.num_pages == 2
    #  no items on first page: there are only two pages
    assert len(paginated_items.items) == 0


async def test_document_types_all_route(
    make_document_type, auth_api_client: AuthTestClient, user
):
    total_doc_type_items = 9
    for i in range(total_doc_type_items):
        await make_document_type(name=f"Invoice {i}", user=user)

    response = await auth_api_client.get("/document-types/all")

    assert response.status_code == 200, response.json()

    items = [schema.DocumentType(**kw) for kw in response.json()]

    assert len(items) == total_doc_type_items


async def test__positive__document_types_all_route_with_group_id_param(
    db_session: AsyncSession, make_document_type, auth_api_client: AuthTestClient, user, make_group
):
    """In this scenario current user belongs to the
    group provided as parameter and there are two document types
    belonging to that group. In such case endpoint should
    return only two document types: the both belonging to the group
    """
    group: orm.Group = await make_group("research")

    total_doc_type_items = 9
    for i in range(total_doc_type_items):
        # privately owned document types
        await make_document_type(name=f"Invoice {i}", user=user)

    await make_document_type(name=f"Research 1", group_id=group.id)
    await make_document_type(name=f"Research 2", group_id=group.id)

    # user belongs to 'research' group
    user.groups.append(group)
    db_session.add(user)
    await db_session.commit()

    response = await auth_api_client.get(
        "/document-types/all", params={"group_id": str(group.id)}
    )

    assert response.status_code == 200, response.json()
    dtype_names = {schema.DocumentType(**kw).name for kw in response.json()}
    assert dtype_names == {"Research 1", "Research 2"}
