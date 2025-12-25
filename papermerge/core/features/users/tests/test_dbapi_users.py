from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from papermerge.core import orm, schema, dbapi


async def test_get_user_group_homes(db_session: AsyncSession, make_user, make_group, system_user):
    """
    In this scenario user belong to one group (familly)
    and group "familly" has special_folders
    """
    user: orm.User = await make_user("momo", is_superuser=False)
    group: orm.Group = await make_group("Familly", with_special_folders=True)

    user_group = orm.UserGroup(
        user=user,
        group=group,
        created_by=system_user.id,
        updated_by=system_user.id,
    )
    db_session.add(user_group)

    await db_session.commit()

    momo_group_homes, _ = await dbapi.get_user_group_homes(db_session, user_id=user.id)

    assert len(momo_group_homes) == 1
    assert momo_group_homes[0].group_name == "Familly"
    assert momo_group_homes[0].group_id == group.id
    assert momo_group_homes[0].home_id


async def test_get_user_group_homes_with_two_groups(db_session: AsyncSession, make_user, make_group, system_user):
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

    user_group_1 = orm.UserGroup(user=user, group=g1, created_by=system_user.id, updated_by=system_user.id)
    user_group_2 = orm.UserGroup(user=user, group=g2, created_by=system_user.id, updated_by=system_user.id)
    user_group_3 = orm.UserGroup(user=user, group=g3_no_home, created_by=system_user.id, updated_by=system_user.id)
    db_session.add_all([user_group_1, user_group_2, user_group_3])

    await db_session.commit()

    momo_group_homes, _ = await dbapi.get_user_group_homes(db_session, user_id=user.id)
    momo_group_home_names = [g.group_name for g in momo_group_homes]

    assert len(momo_group_home_names) == 2
    assert {"g1", "g2"} == set(momo_group_home_names)


async def test_create_user(db_session: AsyncSession):
    """Created user must have associated his/her special folders: home, inbox"""
    db_user = await dbapi.create_user(
        db_session, username="momo", password="momo", email="momo@x.com"
    )

    assert db_user.username == "momo"
    assert db_user.home_folder_id is not None
    assert db_user.inbox_folder_id is not None


async def test_user_delete(db_session: AsyncSession, make_user):
    cur_user: orm.User = await make_user("current_user")
    user: orm.User = await make_user("momo")
    await dbapi.delete_user(
        db_session,
        user_id=user.id,
        deleted_by_user_id=cur_user.id
    )

    stmt = select(func.count(orm.User.id)).where(
        orm.User.deleted_at.is_(None)
    )
    deleted_users_count = (await db_session.execute(stmt)).scalar()
    # Should have 2 users: current_user + system_user
    assert deleted_users_count == 2


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
    Afterwards assign only 1 role.
    Verify that old roles are soft-deleted, not hard-deleted.
    """
    await dbapi.sync_perms(db_session)
    user: orm.User = await make_user("momo", is_superuser=False)

    role1 = await make_role(name="guest1", scopes=["node.create", "node.view"])
    role2 = await make_role(name="guest2", scopes=["tags.create", "tags.view"])

    # First update: assign 2 roles
    attrs = schema.UpdateUser(is_superuser=True, role_ids=[role1.id, role2.id])
    updated_user_details, err = await dbapi.update_user(db_session, user_id=user.id, attrs=attrs)

    assert err is None
    assert len(updated_user_details.roles) == 2
    assert updated_user_details.is_superuser is True

    # Verify the roles are correctly assigned
    role_names = [role.name for role in updated_user_details.roles]
    assert "guest1" in role_names
    assert "guest2" in role_names

    # Second update: assign only 1 role (role1)
    attrs = schema.UpdateUser(role_ids=[role1.id])
    updated_user_details, err = await dbapi.update_user(db_session, user_id=user.id, attrs=attrs)

    assert err is None
    assert len(updated_user_details.roles) == 1
    assert updated_user_details.roles[0].name == "guest1"

    # Verify soft delete: Check that UserRole entries exist but one is soft-deleted
    stmt = select(orm.UserRole).where(orm.UserRole.user_id == user.id)
    result = await db_session.execute(stmt)
    all_user_roles = list(result.scalars())

    # Should have 3 total UserRole entries:
    # - 2 from first assignment (one will be soft-deleted)
    # - 1 new one from second assignment
    assert len(all_user_roles) == 3

    # Count active vs deleted
    active_user_roles = [ur for ur in all_user_roles if ur.deleted_at is None]
    deleted_user_roles = [ur for ur in all_user_roles if ur.deleted_at is not None]

    assert len(active_user_roles) == 1  # Only role1 should be active
    assert len(deleted_user_roles) == 2  # Two should be soft-deleted

    # Verify the active role is role1
    assert active_user_roles[0].role.name == "guest1"

    # Verify scopes are correctly calculated from active roles only
    expected_scopes = ["node.create", "node.view"]  # Only from role1
    assert sorted(updated_user_details.scopes) == sorted(expected_scopes)


async def test_change_password(db_session: AsyncSession, make_user):
    user: orm.User = await make_user("momo", is_superuser=False)

    initial_password = user.password

    await dbapi.change_password(db_session, user_id=user.id, password="updatedpass")

    stmt = select(orm.User).where(orm.User.id == user.id)
    updated_user = (await db_session.execute(stmt)).scalar()

    assert updated_user.password != initial_password


async def test__positive__user_belongs_to(db_session: AsyncSession, make_user, make_group, system_user):
    """In this scenario user belong to one group (familly)"""
    user: orm.User = await make_user("momo", is_superuser=False)
    group: orm.Group = await make_group("familly")

    user_group = orm.UserGroup(
        user=user,
        group=group,
        created_by=system_user.id,
        updated_by=system_user.id,
    )
    db_session.add(user_group)

    await db_session.commit()

    assert  await dbapi.user_belongs_to(db_session, user_id=user.id, group_id=group.id)


async def test__negative__user_belongs_to(db_session: AsyncSession, make_user, make_group):
    user: orm.User = await make_user("momo", is_superuser=False)
    group: orm.Group = await make_group("research")

    # user momo does not belong to group "research"
    belongs_to = await dbapi.user_belongs_to(db_session, user_id=user.id, group_id=group.id)
    assert not belongs_to

async def test_get_user_groups(
    db_session: AsyncSession,
    make_user,
    make_group,
    system_user
):
    user: orm.User = await make_user("david")
    group_dev: orm.Group = await make_group("development")
    group_leads: orm.Group = await make_group("leads")
    await make_group("hr")

    db_session.add_all(
        [
            orm.UserGroup(user=user, group=group_dev, created_by=system_user.id, updated_by=system_user.id),
            orm.UserGroup(user=user, group=group_leads, created_by=system_user.id, updated_by=system_user.id)
        ]
    )
    await db_session.commit()

    groups_david_is_part_of = await dbapi.get_user_groups(db_session, user_id=user.id)
    actual_group_names = {item.name for item in groups_david_is_part_of}
    assert actual_group_names == {"development", "leads"}
