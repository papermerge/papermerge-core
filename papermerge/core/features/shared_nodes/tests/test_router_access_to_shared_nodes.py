from sqlalchemy.ext.asyncio import AsyncSession

from papermerge.core.tests.types import AuthTestClient
from papermerge.core import dbapi, schema
from papermerge.core.scopes import Scopes


async def test_1_get_basic_access_to_shared_nodes(
    auth_api_client: AuthTestClient, make_user, make_folder, db_session: AsyncSession
):
    """
    In this scenario John is sharing his private Folder with David.
    David is logged in (authenticated) and retrieves shared nodes (i.e.
    nodes shared with him).
    In this scenario only one folder is shared. Shared folder does not
    have any descendants - this is a very basic test after all.
    """
    await dbapi.sync_perms(db_session)
    john = await make_user("john", is_superuser=False)
    # authenticated user is David
    david = auth_api_client.user
    receipts = await make_folder("John's Receipts", user=john, parent=john.home_folder)
    role, err = await dbapi.create_role(
        db_session, "ViewDelete Node Role", scopes=[Scopes.NODE_VIEW, Scopes.NODE_DELETE]
    )

    await db_session.commit()

    assert role, err

    # John is sharing a folder (John's private folder) with David
    shared_nodes, _ = await dbapi.create_shared_nodes(
        db_session,
        user_ids=[david.id],
        node_ids=[receipts.id],
        role_ids=[role.id],
        owner_id=john.id,
        created_by=john.id
    )
    # Act / David retrieves shared nodes
    response = await auth_api_client.get(f"/shared-nodes")

    data = response.json()
    folder = schema.Folder(**data["items"][0])

    assert response.status_code == 200, data
    assert len(data["items"]) == 1
    assert folder.title == "John's Receipts"
    assert set(folder.perms) == {Scopes.NODE_VIEW, Scopes.NODE_DELETE}


async def test_2_retrieve_shared_nodes_with_filter(
    auth_api_client: AuthTestClient, make_user, make_folder, db_session: AsyncSession
):
    """
    In this scenario John is sharding two private folders with David.
    When retrieving shared nodes, David also applies a filter.
    """
    await dbapi.sync_perms(db_session)
    john = await make_user("john", is_superuser=False)
    # authenticated user is David
    david = auth_api_client.user
    # John has two private folders
    receipts = await make_folder("John's Receipts", user=john, parent=john.home_folder)
    accounting = await make_folder("John's Accounting", user=john, parent=john.home_folder)
    role, err = await dbapi.create_role(
        db_session, "ViewDelete Node Role", scopes=[Scopes.NODE_VIEW, Scopes.NODE_DELETE]
    )

    await db_session.commit()

    assert role, err

    shared_nodes, _ = await dbapi.create_shared_nodes(
        db_session,
        user_ids=[david.id],
        # John is sharing both folders (receipts and accounting) with David
        node_ids=[receipts.id, accounting.id],
        role_ids=[role.id],
        owner_id=john.id,
        created_by=john.id
    )
    # Act / David retrieves shared nodes with applied filter
    response = await auth_api_client.get("/shared-nodes?filter_free_text=receipts")

    data = response.json()
    folder = schema.Folder(**data["items"][0])

    assert response.status_code == 200, data
    # When filter is applied only one item should be retrieved
    assert len(data["items"]) == 1
    assert folder.title == "John's Receipts"
    assert set(folder.perms) == {Scopes.NODE_VIEW, Scopes.NODE_DELETE}

    # Without filter - both shared nodes are retrieved
    response = await auth_api_client.get("/shared-nodes")
    data = response.json()
    assert response.status_code == 200, data

    assert len(data["items"]) == 2


# Topic: `is_shared` flag
async def test_3_paginated_nodes_are_returned_with_is_shared_flag_set_correctly(
    make_user, make_folder, db_session: AsyncSession, login_as
):
    """
    If node is shared with somebody, then paginated nodes are returned
    (GET /nodes/<parent_id> ) with "is_shared" flag set to true
    """
    await dbapi.sync_perms(db_session)
    john = await make_user("john", is_superuser=False)
    david = await make_user("david", is_superuser=False)
    receipts = await make_folder("John's Receipts", user=john, parent=john.home_folder)
    role, err = await dbapi.create_role(
        db_session, "ViewDelete Node Role", scopes=[Scopes.NODE_VIEW, Scopes.NODE_DELETE]
    )

    await db_session.commit()

    # John is sharing a folder (John's private folder) with David
    await dbapi.create_shared_nodes(
        db_session,
        user_ids=[david.id],
        node_ids=[receipts.id],
        role_ids=[role.id],
        owner_id=john.id,
        created_by=john.id
    )
    api_client = await login_as(john)
    response = await api_client.get(f"/nodes/{john.home_folder.id}")
    assert response.status_code == 200

    data = response.json()
    folder = schema.Folder(**data["items"][0])
    assert folder.is_shared


# Topic: `is_shared` flag
async def test_4_paginated_nodes_are_returned_with_is_shared_flag_set_correctly(
    login_as, make_user, make_folder
):
    """
    In this scenario node is not shared -> "is_shared" flag is
    returned as False
    """
    john = await make_user("john", is_superuser=False)
    await make_folder("John's Receipts", user=john, parent=john.home_folder)

    api_client = await login_as(john)
    response = await api_client.get(f"/nodes/{john.home_folder.id}")

    assert response.status_code == 200

    data = response.json()
    folder = schema.Folder(**data["items"][0])
    assert folder.is_shared is False


# Topic: `is_shared` flag
async def test_5_paginated_for_nodes_shared_multiple_times(
    login_as, make_user, make_folder, db_session: AsyncSession
):
    """
    In this scenario the same node is shared multiple times: this should
    not have any effect on number of entries returned by

        GET /nodes/<parent_id>

    endpoint (e.g. in case shared flag is checked via left join)
    """
    await dbapi.sync_perms(db_session)
    john = await make_user("john", is_superuser=False)
    luke = await make_user("luke", is_superuser=False)
    maria = await make_user("maria", is_superuser=False)

    receipts = await make_folder("John's Receipts", user=john, parent=john.home_folder)
    role1, _ = await dbapi.create_role(
        db_session, "ViewDelete Node Role", scopes=[Scopes.NODE_VIEW, Scopes.NODE_DELETE]
    )
    role2, _ = await dbapi.create_role(db_session, "View Node Role", scopes=[Scopes.NODE_VIEW])

    await db_session.commit()

    # share 1 (with luke, role1)
    await dbapi.create_shared_nodes(
        db_session,
        user_ids=[luke.id],
        node_ids=[receipts.id],
        role_ids=[role1.id],
        owner_id=john.id,
        created_by=john.id
    )
    # share 2 (with maria, role2)
    await dbapi.create_shared_nodes(
        db_session,
        user_ids=[maria.id],
        node_ids=[receipts.id],
        role_ids=[role2.id],
        owner_id=john.id,
        created_by=john.id
    )

    api_client = await login_as(john)
    response = await api_client.get(f"/nodes/{john.home_folder.id}")
    assert response.status_code == 200

    data = response.json()

    # There should be only one item returned, regardless
    # how many shares (i.e. entries in `shared_nodes` table)
    # are associated with "receipts" folder.
    assert len(data["items"]) == 1
    folder = schema.Folder(**data["items"][0])
    # folder is shared indeed
    assert folder.is_shared
