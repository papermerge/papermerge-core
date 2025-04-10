from papermerge.core.features.roles.db import api as dbapi
from papermerge.core.features.auth.scopes import NODE_VIEW, NODE_UPDATE
from papermerge.core.features.shared_nodes.db import api as sn_dbapi
from papermerge.core.features.shared_nodes import schema as sn_schema


def test_basic(db_session, make_user, make_group, make_folder):
    dbapi.sync_perms(db_session)
    john = make_user("john", is_superuser=False)
    david = make_user("david", is_superuser=False)
    family = make_group("family")
    friends = make_group("friends")
    receipts = make_folder("John's Receipts", user=john, parent=john.home_folder)
    role, err = dbapi.create_role(db_session, "RO", scopes=[NODE_VIEW])

    db_session.commit()

    sn_dbapi.create_shared_nodes(
        db_session,
        user_ids=[david.id],
        node_ids=[receipts.id],
        role_ids=[role.id],
        owner_id=john.id,
    )

    sn_dbapi.create_shared_nodes(
        db_session,
        group_ids=[family.id, friends.id],
        node_ids=[receipts.id],
        role_ids=[role.id],
        owner_id=john.id,
    )

    access_details = sn_dbapi.get_shared_node_access_details(
        db_session, node_id=receipts.id
    )

    assert len(access_details.groups) == 2
    assert len(access_details.users) == 1

    users = [sn_schema.UserUpdate(id=david.id, role_ids=[role.id])]
    groups = [sn_schema.GroupUpdate(id=family.id, role_ids=[role.id])]
    access_update = sn_schema.SharedNodeAccessUpdate(
        id=receipts.id, users=users, groups=groups
    )

    sn_dbapi.update_shared_node_access(
        db_session=db_session,
        owner_id=john.id,
        node_id=receipts.id,
        access_update=access_update,
    )

    access_details = sn_dbapi.get_shared_node_access_details(
        db_session, node_id=receipts.id
    )

    assert len(access_details.groups) == 1
    assert len(access_details.users) == 1

    # and now remove groups access entirely
    users = [sn_schema.UserUpdate(id=david.id, role_ids=[role.id])]
    access_update = sn_schema.SharedNodeAccessUpdate(
        id=receipts.id, users=users, groups=[]  # no groups access
    )

    sn_dbapi.update_shared_node_access(
        db_session=db_session,
        owner_id=john.id,
        node_id=receipts.id,
        access_update=access_update,
    )

    access_details = sn_dbapi.get_shared_node_access_details(
        db_session, node_id=receipts.id
    )
    assert len(access_details.groups) == 0  # no groups access
    assert len(access_details.users) == 1


def test_remove_group_access(db_session, make_user, make_group, make_folder):
    """
    In this scenario group and user access is added simultaneously (using
    same `create_shared_nodes` code). Then group access is removed. It is
    expected that user access will still be there.
    """
    dbapi.sync_perms(db_session)
    john = make_user("john", is_superuser=False)
    david = make_user("david", is_superuser=False)
    family = make_group("family")
    friends = make_group("friends")
    receipts = make_folder("John's Receipts", user=john, parent=john.home_folder)
    role, err = dbapi.create_role(db_session, "RO", scopes=[NODE_VIEW])

    db_session.commit()

    # this part is important - both user and group access
    # is granted using same `create_shared_node`
    sn_dbapi.create_shared_nodes(
        db_session,
        user_ids=[david.id],
        group_ids=[family.id, friends.id],
        node_ids=[receipts.id],
        role_ids=[role.id],
        owner_id=john.id,
    )

    access_details = sn_dbapi.get_shared_node_access_details(
        db_session, node_id=receipts.id
    )

    assert len(access_details.groups) == 2
    assert len(access_details.users) == 1

    users = [sn_schema.UserUpdate(id=david.id, role_ids=[role.id])]
    access_update = sn_schema.SharedNodeAccessUpdate(
        id=receipts.id, users=users, groups=[]
    )
    # group access is removed
    sn_dbapi.update_shared_node_access(
        db_session=db_session,
        owner_id=john.id,
        node_id=receipts.id,
        access_update=access_update,
    )

    access_details = sn_dbapi.get_shared_node_access_details(
        db_session, node_id=receipts.id
    )

    # there is no group access
    assert len(access_details.groups) == 0
    # but there is one user who can access the node
    assert len(access_details.users) == 1
