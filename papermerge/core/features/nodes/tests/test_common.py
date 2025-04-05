from papermerge.core.db.common import get_ancestors, has_node_perm
from papermerge.core.features.auth import scopes
from papermerge.core import dbapi


def test_get_ancestors_include_self(make_folder, user, db_session):
    f1 = make_folder("F1", user=user, parent=user.home_folder)
    f2 = make_folder("F2", user=user, parent=f1)
    make_folder("My Resumes", user=user, parent=user.home_folder)

    ancestor_ids = [item[0] for item in get_ancestors(db_session, node_id=f2.id)]
    assert set(ancestor_ids) == {f1.id, f2.id, user.home_folder.id}


def test_get_ancestors_include_self_false(make_folder, user, db_session):
    f1 = make_folder("F1", user=user, parent=user.home_folder)
    f2 = make_folder("F2", user=user, parent=f1)
    make_folder("My Resumes", user=user, parent=user.home_folder)

    ancestor_ids = [
        item[0] for item in get_ancestors(db_session, node_id=f2.id, include_self=False)
    ]
    assert set(ancestor_ids) == {f1.id, user.home_folder.id}


def test_get_ancestors_root_is_first(make_folder, make_document, user, db_session):
    my_docs = make_folder("My Documents", user=user, parent=user.home_folder)
    vertraege = make_folder("Verträge", user=user, parent=my_docs)
    vz = make_document("vertrag.pdf", user=user, parent=vertraege)
    make_folder("My Resumes", user=user, parent=user.home_folder)

    actual_titles = [
        item[1] for item in get_ancestors(db_session, node_id=vz.id, include_self=False)
    ]
    expected_titles = ["home", "My Documents", "Verträge"]

    assert actual_titles == expected_titles


def test_has_node_perm_basic_negative(make_user, make_folder, db_session):
    """
    John and David are two users that do not have anything in common.
    In this scenario it is tested if David has `scopes.NODE_VIEW` access
    to John's folder. Of course David should not have access.
    """
    dbapi.sync_perms(db_session)
    john = make_user("john", is_superuser=False)
    david = make_user("david", is_superuser=False)
    receipts = make_folder("John's Receipts", user=john, parent=john.home_folder)

    has_access = has_node_perm(
        db_session, node_id=receipts.id, codename=scopes.NODE_VIEW, user_id=david.id
    )

    assert has_access is False


def test_has_node_perm_basic_positive(make_user, make_folder, db_session):
    """
    In this scenario John grant's access to David to his own private
    folder by sharing it
    """
    dbapi.sync_perms(db_session)
    john = make_user("john", is_superuser=False)
    david = make_user("david", is_superuser=False)
    receipts = make_folder("John's Receipts", user=john, parent=john.home_folder)
    role, _ = dbapi.create_role(db_session, "View Node Role", scopes=[scopes.NODE_VIEW])
    dbapi.create_shared_nodes(
        db_session,
        user_ids=[david.id],
        # John is sharing both folder (receipts) with David
        node_ids=[receipts.id],
        role_ids=[role.id],
        owner_id=john.id,
    )

    has_access = has_node_perm(
        db_session, node_id=receipts.id, codename=scopes.NODE_VIEW, user_id=david.id
    )

    assert has_access is True


def test_has_node_perm_recursive_nodes(
    make_user, make_folder, make_document, db_session
):
    """
    In this scenario John grant's access to David to his own private
    folder "receipts". Now David should have access not just to "receipts", but
    also to any descendant node of the "receipt" folder.
    """
    dbapi.sync_perms(db_session)

    john = make_user("john", is_superuser=False)
    david = make_user("david", is_superuser=False)

    receipts = make_folder("John's Receipts", user=john, parent=john.home_folder)
    descendant_f1 = make_folder("Descendant F1", user=john, parent=receipts)
    grandchild_d1 = make_document("Grandchild D1", user=john, parent=descendant_f1)
    descendant_d1 = make_document("Descendant D1", user=john, parent=receipts)

    role, _ = dbapi.create_role(db_session, "View Node Role", scopes=[scopes.NODE_VIEW])

    dbapi.create_shared_nodes(
        db_session,
        user_ids=[david.id],
        # John is sharing both folder (receipts) with David
        node_ids=[receipts.id],
        role_ids=[role.id],
        owner_id=john.id,
    )

    shared_nodes = [receipts.id, descendant_f1.id, descendant_d1.id, grandchild_d1.id]
    for node_id in shared_nodes:
        # has access for scopes.NODE_VIEW
        assert has_node_perm(
            db_session, node_id=node_id, codename=scopes.NODE_VIEW, user_id=david.id
        )
        # doesn't have access for e.g. scopes.NODE_UPDATE
        assert not has_node_perm(
            db_session, node_id=node_id, codename=scopes.NODE_UPDATE, user_id=david.id
        )
