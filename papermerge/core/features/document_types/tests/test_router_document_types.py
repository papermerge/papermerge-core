from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from papermerge.core.types import OwnerType, ResourceType
from papermerge.core import schema, orm
from papermerge.core.tests.types import AuthTestClient
from papermerge.core.features.users.db import api as users_api
from papermerge.core.features.users import schema as users_schema
from papermerge.core.features.ownership.db import api as ownership_dbapi
from papermerge.core.features.document_types import schema as dt_schema


async def test_create_document_type_with_path_template(
    auth_api_client: AuthTestClient,
    db_session: AsyncSession,
    make_user,
):
    user = await make_user(username="momo")
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
            "owner_id": str(user.id),
            "owner_type": OwnerType.USER
        },
    )
    assert response.status_code == 201, response.json()

    count_after =(
        await db_session.execute(select(func.count(orm.DocumentType.id)))
    ).scalar()
    assert count_after == 1

    document_type = schema.DocumentTypeShort.model_validate(response.json())
    assert document_type.name == "Invoice"
    assert document_type.path_template == "/home/My ZDF/"


async def test_update_document_type_with_path_template(
    make_document_type,
    auth_api_client: AuthTestClient,
    db_session: AsyncSession
):
    user = auth_api_client.user
    doc_type = await make_document_type(name="ZDF", path_template="/home/", user=user)
    response = await auth_api_client.patch(
        f"/document-types/{doc_type.id}",
        json={
            "name": "Invoice",
            "path_template": "/home/My ZDF/updated/",
            "custom_field_ids": [],
        },
    )

    assert response.status_code == 200, response.json()

    document_type = schema.DocumentTypeShort.model_validate(response.json())
    assert document_type.path_template == "/home/My ZDF/updated/"


async def test_create_document_type_owned_by_user(
    make_custom_field_v2,
    auth_api_client: AuthTestClient,
    db_session: AsyncSession
):
    cf1: schema.CustomField = await make_custom_field_v2(name="shop", type_handler="text")
    cf2: schema.CustomField = await make_custom_field_v2(name="total", type_handler="monetary")
    user = auth_api_client.user

    count_before = (await db_session.execute(
        select(func.count(orm.DocumentType.id))
    )).scalar()
    assert count_before == 0

    response = await auth_api_client.post(
        "/document-types/",
        json={
            "name": "Invoice",
            "custom_field_ids": [str(cf1.id), str(cf2.id)],
            "owner_type": OwnerType.USER,
            "owner_id": str(user.id)
        },
    )

    assert response.status_code == 201, response.json()

    count_after = (await db_session.execute(select(func.count(orm.DocumentType.id)))).scalar()
    assert count_after == 1

    document_type = schema.DocumentTypeShort.model_validate(response.json())
    assert document_type.name == "Invoice"
    owner_type, owner_id = await ownership_dbapi.get_owner_info(
        db_session,
        resource_type=ResourceType.DOCUMENT_TYPE,
        resource_id=document_type.id
    )

    assert document_type.name == "Invoice"
    assert owner_type == OwnerType.USER
    assert owner_id == user.id


async def test_create_document_type_owned_by_group(
    make_custom_field_v2, auth_api_client: AuthTestClient, db_session: AsyncSession, make_group
):
    """Create a document type owned by the group"""
    group: orm.Group = await make_group("Family", with_special_folders=True)
    cf1: schema.CustomField = await make_custom_field_v2(
        name="shop", type_handler="text", group_id=group.id
    )
    cf2: schema.CustomField = await make_custom_field_v2(
        name="total", type_handler="monetary", group_id=group.id
    )

    count_before = (await db_session.execute(select(func.count(orm.DocumentType.id)))).scalar()
    assert count_before == 0

    response = await auth_api_client.post(
        "/document-types/",
        json={
            "name": "Invoice",
            "custom_field_ids": [str(cf1.id), str(cf2.id)],
            "owner_id": str(group.id),
            "owner_type": OwnerType.GROUP
        },
    )

    assert response.status_code == 201, response.json()

    count_after = (await db_session.execute(select(func.count(orm.DocumentType.id)))).scalar()
    assert count_after == 1

    document_type = schema.DocumentTypeShort.model_validate(response.json())
    owner_type, owner_id = await ownership_dbapi.get_owner_info(
        db_session,
        resource_type=ResourceType.DOCUMENT_TYPE,
        resource_id=document_type.id
    )

    assert document_type.name == "Invoice"
    assert owner_type == OwnerType.GROUP
    assert owner_id == group.id


async def test_list_document_types(make_document_type, auth_api_client: AuthTestClient):
    user = auth_api_client.user
    await make_document_type(name="Invoice", user=user)
    response = await auth_api_client.get("/document-types/all")

    assert response.status_code == 200, response.json()


async def test_update_document_type(
    auth_api_client: AuthTestClient,
    db_session: AsyncSession,
    make_document_type,
    make_custom_field_v2,
):
    cf1 = await make_custom_field_v2(name="cf1", type_handler="text")
    cf2 = await make_custom_field_v2(name="cf2", type_handler="boolean")
    user = auth_api_client.user
    doc_type = await make_document_type(name="Invoice", user=user)

    response = await auth_api_client.patch(
        f"/document-types/{doc_type.id}",
        json={
            "name": "Invoice-updated",
            "custom_field_ids": [str(cf1.id), str(cf2.id)],
        },
    )
    assert response.status_code == 200
    updated_dtype = schema.DocumentTypeShort(**response.json())
    assert updated_dtype.name == "Invoice-updated"


async def test_update_group_id_field_in_document_type(
    auth_api_client: AuthTestClient,
    db_session: AsyncSession,
    make_document_type,
    make_group,
    system_user
):
    """
    Update group_id field of document type.
    DocumentType is owned by user and user can transfer ownership to
    the group.
    """
    user = auth_api_client.user
    doc_type = await make_document_type(name="Invoice", user=user)
    group: orm.Group = await make_group("Familly", with_special_folders=True)


    user_group = orm.UserGroup(
        user=user,
        group=group,
        created_by=system_user.id,
        updated_by=system_user.id,
    )
    db_session.add(user_group)

    await db_session.commit()

    response = await auth_api_client.patch(
        f"/document-types/{doc_type.id}",
        json={
            "owner_id": str(group.id),
            "owner_type": OwnerType.GROUP
        },
    )

    assert response.status_code == 200
    owner_type, owner_id = await ownership_dbapi.get_owner_info(
        db_session, ResourceType.DOCUMENT_TYPE, resource_id=doc_type.id
    )
    assert owner_type == OwnerType.GROUP
    assert owner_id == group.id

async def test_delete_document_type(
    auth_api_client: AuthTestClient,
    db_session: AsyncSession,
    make_document_type,
):
    doc_type = await make_document_type(name="Invoice", user=auth_api_client.user)
    count_before = (await db_session.execute(select(func.count(orm.DocumentType.id)))).scalar()
    assert count_before == 1

    response = await auth_api_client.delete(f"/document-types/{doc_type.id}")

    assert response.status_code == 204, response.json()


async def test_paginated_result__9_items_first_page(
    make_document_type, auth_api_client: AuthTestClient, user
):
    total_doc_type_items = 9
    for i in range(total_doc_type_items):
        await make_document_type(name=f"Invoice {i}", user=user)

    params = {"page_size": 5, "page_number": 1}
    response = await auth_api_client.get("/document-types/", params=params)

    assert response.status_code == 200, response.json()

    paginated_items = schema.PaginatedResponse[schema.DocumentTypeEx](**response.json())

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

    paginated_items = schema.PaginatedResponse[schema.DocumentTypeEx](**response.json())

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

    items = [schema.DocumentTypeShort(**kw) for kw in response.json()]

    assert len(items) == total_doc_type_items


async def test__positive__document_types_all_route_with_group_id_param(
    db_session: AsyncSession,
    make_document_type,
    auth_api_client: AuthTestClient,
    user,
    make_group,
    system_user
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
    user_group = orm.UserGroup(
        user=user,
        group=group,
        created_by=system_user.id,
        updated_by=system_user.id,
    )
    db_session.add(user_group)
    await db_session.commit()

    response = await auth_api_client.get(
        "/document-types/all", params={"group_id": str(group.id)}
    )

    assert response.status_code == 200, response.json()
    dtype_names = {schema.DocumentTypeShort(**kw).name for kw in response.json()}
    assert dtype_names == {"Research 1", "Research 2"}


async def test_all_grouped_ep(
    db_session: AsyncSession,
    login_as,
    make_document_type,
    make_group,
    make_user,
):
    user: orm.User = await make_user(username="coco")
    group: orm.Group = await make_group("team one")
    await make_document_type(name="My Private", user=user)
    await make_document_type(name="Anual reports", group_id=group.id)
    await make_document_type(name="q2 reports", group_id=group.id)

    api_client = await login_as(user)
    update_attrs = users_schema.UpdateUser(group_ids=[group.id])
    await users_api.update_user(db_session, user_id=user.id, attrs=update_attrs)

    response = await api_client.get(
        "/document-types/all-grouped"
    )

    assert response.status_code == 200, response.json()
    data = response.json()
    assert len(data) == 2
    group_names = [dt_schema.GroupedDocumentType(**item).name for item in data]
    assert set(group_names) == {"My", "team one"}
