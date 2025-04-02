from papermerge.core.tests.types import AuthTestClient
from papermerge.core.features.auth.scopes import NODE_VIEW, NODE_DELETE
from papermerge.core import dbapi, schema


def test_1_get_basic_access_to_shared_nodes(
    auth_api_client: AuthTestClient, make_user, make_folder, db_session
):
    """
    In this scenario John is sharing his private Folder with David.
    David is logged in (authenticated) and retrieves shared nodes (i.e.
    nodes shared with him).
    In this scenario only one folder is shared. Shared folder does not
    have any descendants - this is a very basic test after all.
    """
    dbapi.sync_perms(db_session)
    john = make_user("john", is_superuser=False)
    # authenticated user is David
    david = auth_api_client.user
    receipts = make_folder("John's Receipts", user=john, parent=john.home_folder)
    role, err = dbapi.create_role(
        db_session, "ViewDelete Node Role", scopes=[NODE_VIEW, NODE_DELETE]
    )

    db_session.commit()

    assert role, err

    # John is sharing a folder (John's private folder) with David
    shared_nodes, _ = dbapi.create_shared_nodes(
        db_session,
        user_ids=[david.id],
        node_ids=[receipts.id],
        role_ids=[role.id],
        owner_id=john.id,
    )
    # Act / David retrieves shared nodes
    response = auth_api_client.get(f"/shared-nodes/")

    data = response.json()
    folder = schema.Folder(**data["items"][0])

    assert response.status_code == 200, data
    assert len(data["items"]) == 1
    assert folder.title == "John's Receipts"
    assert set(folder.perms) == {NODE_VIEW, NODE_DELETE}


def test_2_retrieve_shared_nodes_with_filter(
    auth_api_client: AuthTestClient, make_user, make_folder, db_session
):
    """
    In this scenario John is sharding two private folders with David.
    When retrieving shared nodes, David also applies a filter.
    """
    dbapi.sync_perms(db_session)
    john = make_user("john", is_superuser=False)
    # authenticated user is David
    david = auth_api_client.user
    # John has two private folders
    receipts = make_folder("John's Receipts", user=john, parent=john.home_folder)
    accounting = make_folder("John's Accounting", user=john, parent=john.home_folder)
    role, err = dbapi.create_role(
        db_session, "ViewDelete Node Role", scopes=[NODE_VIEW, NODE_DELETE]
    )

    db_session.commit()

    assert role, err

    shared_nodes, _ = dbapi.create_shared_nodes(
        db_session,
        user_ids=[david.id],
        # John is sharing both folders (receipts and accounting) with David
        node_ids=[receipts.id, accounting.id],
        role_ids=[role.id],
        owner_id=john.id,
    )
    # Act / David retrieves shared nodes with applied filter
    response = auth_api_client.get("/shared-nodes/?filter=receipts")

    data = response.json()
    folder = schema.Folder(**data["items"][0])

    assert response.status_code == 200, data
    # When filter is applied only one item should be retrieved
    assert len(data["items"]) == 1
    assert folder.title == "John's Receipts"
    assert set(folder.perms) == {NODE_VIEW, NODE_DELETE}

    # Without filter - both shared nodes are retrieved
    response = auth_api_client.get("/shared-nodes/")
    data = response.json()
    assert response.status_code == 200, data

    assert len(data["items"]) == 2
