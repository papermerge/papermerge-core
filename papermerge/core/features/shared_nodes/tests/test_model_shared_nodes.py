from papermerge.core.features.roles.db import api as dbapi
from papermerge.core.features.auth.scopes import NODE_VIEW
from papermerge.core.features.shared_nodes.db import api as sn_dbapi


def test_basic_create_shared_node(db_session, make_user, make_folder):
    dbapi.sync_perms(db_session)
    john = make_user("john", is_superuser=False)
    david = make_user("david", is_superuser=False)
    receipts = make_folder("John's Receipts", user=john, parent=john.home_folder)
    role, err = dbapi.create_role(db_session, "View Node Role", scopes=[NODE_VIEW])

    db_session.commit()

    assert role, err

    shared_nodes, _ = sn_dbapi.create_shared_nodes(
        db_session,
        user_ids=[david.id],
        node_ids=[receipts.id],
        role_ids=[role.id],
        owner_id=john.id,
    )

    assert len(shared_nodes) == 1

    dbapi.delete_role(db_session, role.id)
