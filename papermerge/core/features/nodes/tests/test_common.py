from sqlalchemy.ext.asyncio import AsyncSession

from papermerge.core.db.common import get_ancestors, has_node_perm
from papermerge.core.features.auth import scopes
from papermerge.core import dbapi


async def test_get_ancestors_include_self(make_folder, user, db_session: AsyncSession):
    f1 = await make_folder("F1", user=user, parent=user.home_folder)
    f2 = await make_folder("F2", user=user, parent=f1)
    await make_folder("My Resumes", user=user, parent=user.home_folder)

    ancestor_ids = [item[0] for item in await get_ancestors(db_session, node_id=f2.id)]
    assert set(ancestor_ids) == {f1.id, f2.id, user.home_folder.id}


async def test_get_ancestors_include_self_false(make_folder, user, db_session: AsyncSession):
    f1 = await make_folder("F1", user=user, parent=user.home_folder)
    f2 = await make_folder("F2", user=user, parent=f1)
    await make_folder("My Resumes", user=user, parent=user.home_folder)

    ancestor_ids = [
        item[0] for item in await get_ancestors(db_session, node_id=f2.id, include_self=False)
    ]
    assert set(ancestor_ids) == {f1.id, user.home_folder.id}


async def test_get_ancestors_root_is_first(make_folder, make_document, user, db_session: AsyncSession):
    my_docs = await make_folder("My Documents", user=user, parent=user.home_folder)
    vertraege = await make_folder("Verträge", user=user, parent=my_docs)
    vz = await make_document("vertrag.pdf", user=user, parent=vertraege)
    await make_folder("My Resumes", user=user, parent=user.home_folder)

    actual_titles = [
        item[1] for item in await get_ancestors(db_session, node_id=vz.id, include_self=False)
    ]
    expected_titles = ["home", "My Documents", "Verträge"]

    assert actual_titles == expected_titles


async def test_has_node_perm_basic_negative(make_user, make_folder, db_session: AsyncSession):
    """
    John and David are two users that do not have anything in common.
    In this scenario it is tested if David has `scopes.NODE_VIEW` access
    to John's folder. Of course David should not have access.
    """
    await dbapi.sync_perms(db_session)
    john = await make_user("john", is_superuser=False)
    david = await make_user("david", is_superuser=False)
    receipts = await make_folder("John's Receipts", user=john, parent=john.home_folder)

    has_access = await has_node_perm(
        db_session, node_id=receipts.id, codename=scopes.NODE_VIEW, user_id=david.id
    )

    assert has_access is False


async def test_has_node_perm_basic_positive(make_user, make_folder, db_session: AsyncSession):
    """
    In this scenario John grant's access to David to his own private
    folder by sharing it
    """
    await dbapi.sync_perms(db_session)
    john = await make_user("john", is_superuser=False)
    david = await make_user("david", is_superuser=False)
    receipts = await make_folder("John's Receipts", user=john, parent=john.home_folder)
    role, _ = await dbapi.create_role(db_session, "View Node Role", scopes=[scopes.NODE_VIEW])
    await dbapi.create_shared_nodes(
        db_session,
        user_ids=[david.id],
        # John is sharing both folder (receipts) with David
        node_ids=[receipts.id],
        role_ids=[role.id],
        owner_id=john.id,
        created_by=john.id
    )

    has_access = await has_node_perm(
        db_session, node_id=receipts.id, codename=scopes.NODE_VIEW, user_id=david.id
    )

    assert has_access is True


async def test_has_node_perm_recursive_nodes(
    make_user, make_folder, make_document, db_session: AsyncSession
):
    """
    In this scenario John grant's access to David to his own private
    folder "receipts". Now David should have access not just to "receipts", but
    also to any descendant node of the "receipt" folder.
    """
    await dbapi.sync_perms(db_session)

    john = await make_user("john", is_superuser=False)
    david = await make_user("david", is_superuser=False)

    receipts = await make_folder("John's Receipts", user=john, parent=john.home_folder)
    descendant_f1 = await make_folder("Descendant F1", user=john, parent=receipts)
    grandchild_d1 = await make_document("Grandchild D1", user=john, parent=descendant_f1)
    descendant_d1 = await make_document("Descendant D1", user=john, parent=receipts)

    role, _ = await dbapi.create_role(db_session, "View Node Role", scopes=[scopes.NODE_VIEW])

    await dbapi.create_shared_nodes(
        db_session,
        user_ids=[david.id],
        # John is sharing both folder (receipts) with David
        node_ids=[receipts.id],
        role_ids=[role.id],
        owner_id=john.id,
        created_by=john.id
    )

    shared_nodes = [receipts.id, descendant_f1.id, descendant_d1.id, grandchild_d1.id]
    for node_id in shared_nodes:
        # has access for scopes.NODE_VIEW
        assert await has_node_perm(
            db_session, node_id=node_id, codename=scopes.NODE_VIEW, user_id=david.id
        )
        # doesn't have access for e.g. scopes.NODE_UPDATE
        assert not await has_node_perm(
            db_session, node_id=node_id, codename=scopes.NODE_UPDATE, user_id=david.id
        )
