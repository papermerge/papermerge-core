from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from papermerge.core import orm, schema, dbapi


async def test_get_user_group_homes(db_session: AsyncSession, make_user, make_group):
    """
    In this scenario user belong to one group (familly)
    and group "familly" has special_folders
    """
    user: orm.User = await make_user("momo", is_superuser=False)
    group: orm.Group = await make_group("Familly", with_special_folders=True)

    db_session.add_all([user, group])
    user.groups.append(group)
    await db_session.commit()

    momo_group_homes, _ = await dbapi.get_user_group_homes(db_session, user_id=user.id)

    assert len(momo_group_homes) == 1
    assert momo_group_homes[0].group_name == "Familly"
    assert momo_group_homes[0].group_id == group.id
    assert momo_group_homes[0].home_id


async def test_get_user_group_homes_with_two_groups(db_session: AsyncSession, make_user, make_group):
    """
    In this scenario user belong to three groups.
    Two groups have special folders and one does not.
    In such case `get_user_group_homes` should return only
    groups that have home folder.
    """
    user: orm.User = await make_user("momo", is_superuser=False)
    g1: orm.Group = await make_group("g1", with_special_folders=True)
    g2: orm.Group = await make_group("g2", with_special_folders=True)
    g3_no_home: orm.Group = await make_group("g3_no_home", with_special_folders=False)

    db_session.add_all([g1, g2, g3_no_home, user])
    user.groups.extend([g1, g2, g3_no_home])
    await db_session.commit()

    momo_group_homes, _ = await dbapi.get_user_group_homes(db_session, user_id=user.id)
    momo_group_home_names = [g.group_name for g in momo_group_homes]

    assert len(momo_group_home_names) == 2
    assert {"g1", "g2"} == set(momo_group_home_names)


async def test_create_user(db_session: AsyncSession):
    """Created user must have associated his/her special folders: home, inbox"""
    user, error = await dbapi.create_user(
        db_session, username="momo", password="momo", email="momo@x.com"
    )

    assert error is None
    assert user.username == "momo"
    assert user.home_folder_id is not None
    assert user.inbox_folder_id is not None


async def test_user_delete(db_session: AsyncSession, make_user):
    user: orm.User = await make_user("momo")
    await dbapi.delete_user(db_session, username=user.username)

    stmt = select(func.count(orm.User.id))
    users_count = (await db_session.execute(stmt)).scalar()

    assert users_count == 0


async def test_user_update(db_session: AsyncSession, make_user):
    user: orm.User = await make_user("momo", is_superuser=False)

    assert user.is_superuser == False

    # update user's `is_superuser` to `True`
    attrs = schema.UpdateUser(is_superuser=True)
    await dbapi.update_user(db_session, user_id=user.id, attrs=attrs)

    stmt = select(orm.User).where(orm.User.id == user.id)
    updated_user = (await db_session.execute(stmt)).scalar()

    assert updated_user.is_superuser == True


async def test_update_user_roles(db_session: AsyncSession, make_user, make_role):
    """
    Assign to the user initially 2 roles.
    Afterwords assign only 1 role.
    """
    await dbapi.sync_perms(db_session)
    user: orm.User = await make_user("momo", is_superuser=False)

    role1 = await make_role(name="guest1", scopes=["node.create", "node.view"])
    role2 = await make_role(name="guest2", scopes=["tags.create", "tags.view"])

    attrs = schema.UpdateUser(is_superuser=True, role_ids=[role1.id, role2.id])
    await dbapi.update_user(db_session, user_id=user.id, attrs=attrs)

    stmt = select(orm.User).options(
        selectinload(orm.User.roles)
    ).where(orm.User.id == user.id)

    updated_user = (await db_session.execute(stmt)).scalar_one()

    assert len(updated_user.roles) == 2

    attrs = schema.UpdateUser(is_superuser=True, role_ids=[role1.id])
    await dbapi.update_user(db_session, user_id=user.id, attrs=attrs)

    stmt = select(orm.User).options(
        selectinload(orm.User.roles)
    ).where(orm.User.id == user.id)

    updated_user = (await db_session.execute(stmt)).scalar_one()

    assert len(updated_user.roles) == 1


async def test_change_password(db_session: AsyncSession, make_user):
    user: orm.User = await make_user("momo", is_superuser=False)

    initial_password = user.password

    await dbapi.change_password(db_session, user_id=user.id, password="updatedpass")

    stmt = select(orm.User).where(orm.User.id == user.id)
    updated_user = (await db_session.execute(stmt)).scalar()

    assert updated_user.password != initial_password


async def test__positive__user_belongs_to(db_session: AsyncSession, make_user, make_group):
    """In this scenario user belong to one group (familly)"""
    user: orm.User = await make_user("momo", is_superuser=False)
    group: orm.Group = await make_group("familly")

    db_session.add_all([user, group])
    user.groups.append(group)
    await db_session.commit()

    assert  await dbapi.user_belongs_to(db_session, user_id=user.id, group_id=group.id)


async def test__negative__user_belongs_to(db_session: AsyncSession, make_user, make_group):
    user: orm.User = await make_user("momo", is_superuser=False)
    group: orm.Group = await make_group("research")

    # user momo does not belong to group "research"
    belongs_to = await dbapi.user_belongs_to(db_session, user_id=user.id, group_id=group.id)
    assert not belongs_to
