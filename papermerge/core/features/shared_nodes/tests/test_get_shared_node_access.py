from sqlalchemy.ext.asyncio import AsyncSession

from papermerge.core.features.roles.db import api as dbapi
from papermerge.core.scopes import Scopes
from papermerge.core.features.shared_nodes.db import api as sn_dbapi


async def test_basic(db_session: AsyncSession, make_user, make_folder):
    await dbapi.sync_perms(db_session)
    john = await make_user("john", is_superuser=False)
    david = await make_user("david", is_superuser=False)
    receipts = await make_folder("John's Receipts", user=john, parent=john.home_folder)
    role, err = await dbapi.create_role(db_session, "View Node Role", scopes=[Scopes.NODE_VIEW])

    await db_session.commit()

    await sn_dbapi.create_shared_nodes(
        db_session,
        user_ids=[david.id],
        node_ids=[receipts.id],
        role_ids=[role.id],
        owner_id=john.id,
        created_by=john.id,
    )

    access_details = await sn_dbapi.get_shared_node_access_details(
        db_session, node_id=receipts.id
    )

    assert len(access_details.groups) == 0
    assert len(access_details.users) == 1
    assert access_details.users[0].username == "david"
    assert len(access_details.users[0].roles) == 1
    assert access_details.users[0].roles[0].name == "View Node Role"


async def test_one_user_multiple_roles(db_session: AsyncSession, make_user, make_folder):
    await dbapi.sync_perms(db_session)
    john = await make_user("john", is_superuser=False)
    david = await make_user("david", is_superuser=False)
    receipts = await make_folder("John's Receipts", user=john, parent=john.home_folder)
    role1, _ = await dbapi.create_role(db_session, "View Node Role", scopes=[Scopes.NODE_VIEW])
    role2, _ = await dbapi.create_role(
        db_session, "View/Update Node Role", scopes=[Scopes.NODE_VIEW, Scopes.NODE_UPDATE]
    )

    await db_session.commit()

    await sn_dbapi.create_shared_nodes(
        db_session,
        user_ids=[david.id],
        node_ids=[receipts.id],
        role_ids=[role1.id, role2.id],
        owner_id=john.id,
        created_by=john.id,
    )

    access_details = await sn_dbapi.get_shared_node_access_details(
        db_session, node_id=receipts.id
    )

    assert len(access_details.groups) == 0
    assert len(access_details.users) == 1
    assert access_details.users[0].username == "david"
    assert len(access_details.users[0].roles) == 2
    roles = [role.name for role in access_details.users[0].roles]
    assert set(roles) == {"View Node Role", "View/Update Node Role"}
