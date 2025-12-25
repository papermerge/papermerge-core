from sqlalchemy.ext.asyncio import AsyncSession

from papermerge.core import orm, dbapi


async def test_user_groups(db_session: AsyncSession, make_user, make_group, system_user):
    """User details should return all user's groups"""
    user: orm.User = await make_user("momo", is_superuser=False)
    group: orm.Group = await make_group("family")

    user_group = orm.UserGroup(
        user=user,
        group=group,
        created_by=system_user.id,
        updated_by=system_user.id,
    )
    db_session.add(user_group)
    await db_session.commit()

    user_details, err = await dbapi.get_user_details(db_session, user.id)

    assert err is None
    assert "family" in [g.name for g in user_details.groups]


async def test_user_roles(db_session: AsyncSession, make_user, make_role, system_user):
    """User details should return all user's roles"""
    user: orm.User = await make_user("momo", is_superuser=False)
    role: orm.Role = await make_role("employee")

    user_role = orm.UserRole(
        user=user,
        role=role,
        created_by=system_user.id,
        updated_by=system_user.id,
    )
    db_session.add_all([user, role, user_role])

    await db_session.commit()

    user_details, err = await dbapi.get_user_details(db_session, user.id)

    assert err is None
    assert "employee" in [r.name for r in user_details.roles]


async def test_user_scopes(db_session: AsyncSession, make_user, make_role, system_user):
    """User details should return all user's scopes"""
    await dbapi.sync_perms(db_session)
    user: orm.User = await make_user("momo", is_superuser=False)
    role: orm.Role = await make_role("employee", scopes=["node.create", "node.view"])

    user_role = orm.UserRole(
        user=user,
        role=role,
        created_by=system_user.id,
        updated_by=system_user.id,
    )
    db_session.add_all([user, role, user_role])

    await db_session.commit()
    user_details, err = await dbapi.get_user_details(db_session, user.id)

    assert err is None
    assert "node.create" in [scope for scope in user_details.scopes]
    assert "node.view" in [scope for scope in user_details.scopes]
