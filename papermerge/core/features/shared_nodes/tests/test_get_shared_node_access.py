from papermerge.core.features.roles.db import api as dbapi
from papermerge.core.features.auth.scopes import NODE_VIEW, NODE_UPDATE
from papermerge.core.features.shared_nodes.db import api as sn_dbapi


def test_basic(db_session, make_user, make_folder):
    dbapi.sync_perms(db_session)
    john = make_user("john", is_superuser=False)
    david = make_user("david", is_superuser=False)
    receipts = make_folder("John's Receipts", user=john, parent=john.home_folder)
    role, err = dbapi.create_role(db_session, "View Node Role", scopes=[NODE_VIEW])

    db_session.commit()

    sn_dbapi.create_shared_nodes(
        db_session,
        user_ids=[david.id],
        node_ids=[receipts.id],
        role_ids=[role.id],
        owner_id=john.id,
    )

    access_details = sn_dbapi.get_shared_node_access_details(
        db_session, node_id=receipts.id
    )

    assert len(access_details.groups) == 0
    assert len(access_details.users) == 1
    assert access_details.users[0].username == "david"
    assert len(access_details.users[0].roles) == 1
    assert access_details.users[0].roles[0].name == "View Node Role"


def test_one_user_multiple_roles(db_session, make_user, make_folder):
    dbapi.sync_perms(db_session)
    john = make_user("john", is_superuser=False)
    david = make_user("david", is_superuser=False)
    receipts = make_folder("John's Receipts", user=john, parent=john.home_folder)
    role1, _ = dbapi.create_role(db_session, "View Node Role", scopes=[NODE_VIEW])
    role2, _ = dbapi.create_role(
        db_session, "View/Update Node Role", scopes=[NODE_VIEW, NODE_UPDATE]
    )

    db_session.commit()

    sn_dbapi.create_shared_nodes(
        db_session,
        user_ids=[david.id],
        node_ids=[receipts.id],
        role_ids=[role1.id, role2.id],
        owner_id=john.id,
    )

    access_details = sn_dbapi.get_shared_node_access_details(
        db_session, node_id=receipts.id
    )

    assert len(access_details.groups) == 0
    assert len(access_details.users) == 1
    assert access_details.users[0].username == "david"
    assert len(access_details.users[0].roles) == 2
    roles = [role.name for role in access_details.users[0].roles]
    assert set(roles) == {"View Node Role", "View/Update Node Role"}
