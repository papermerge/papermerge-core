from sqlalchemy.ext.asyncio import AsyncSession

from papermerge.core.features.roles.db import api as dbapi
from papermerge.core.scopes import Scopes
from papermerge.core.features.shared_nodes.db import api as sn_dbapi


async def test_basic_create_shared_node(db_session: AsyncSession, make_user, make_folder):
    await dbapi.sync_perms(db_session)
    john = await make_user("john", is_superuser=False)
    david = await make_user("david", is_superuser=False)
    receipts = await make_folder("John's Receipts", user=john, parent=john.home_folder)
    role, err = await dbapi.create_role(db_session, "View Node Role", scopes=[Scopes.NODE_VIEW])

    await db_session.commit()

    assert role, err

    shared_nodes, _ = await sn_dbapi.create_shared_nodes(
        db_session,
        user_ids=[david.id],
        node_ids=[receipts.id],
        role_ids=[role.id],
        owner_id=john.id,
        created_by=john.id
    )

    assert len(shared_nodes) == 1

    await dbapi.delete_role(db_session, role.id, deleted_by_user_id=john.id)
