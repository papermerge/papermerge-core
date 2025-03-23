from sqlalchemy import func, select

from papermerge.core.features.users.db import api as dbapi
from papermerge.core import orm
from papermerge.core import schema


def test_get_user_group_homes(db_session, make_user, make_group):
    """
    In this scenario user belong to one group (familly)
    and group "familly" has special_folders
    """
    user: orm.User = make_user("momo", is_superuser=False)
    group: orm.Group = make_group("Familly", with_special_folders=True)

    user.groups.append(group)
    db_session.add(user)
    db_session.commit()

    momo_group_homes, _ = dbapi.get_user_group_homes(db_session, user_id=user.id)

    assert len(momo_group_homes) == 1
    assert momo_group_homes[0].group_name == "Familly"
    assert momo_group_homes[0].group_id == group.id
    assert momo_group_homes[0].home_id


def test_get_user_group_homes_with_two_groups(db_session, make_user, make_group):
    """
    In this scenario user belong to three groups.
    Two groups have special folders and one does not.
    In such case `get_user_group_homes` should return only
    groups that have home folder.
    """
    user: orm.User = make_user("momo", is_superuser=False)
    g1: orm.Group = make_group("g1", with_special_folders=True)
    g2: orm.Group = make_group("g2", with_special_folders=True)
    g3_no_home: orm.Group = make_group("g3_no_home", with_special_folders=False)

    user.groups.extend([g1, g2, g3_no_home])
    db_session.add(user)
    db_session.commit()

    momo_group_homes, _ = dbapi.get_user_group_homes(db_session, user_id=user.id)
    momo_group_home_names = [g.group_name for g in momo_group_homes]

    assert len(momo_group_home_names) == 2
    assert {"g1", "g2"} == set(momo_group_home_names)


def test_create_user(db_session):
    user, error = dbapi.create_user(
        db_session, username="momo", password="momo", email="momo@x.com"
    )

    assert error is None
    assert user.username == "momo"


def test_user_delete(db_session, make_user):
    user: orm.User = make_user("momo")
    dbapi.delete_user(db_session, username=user.username)

    stmt = select(func.count(orm.User.id))
    users_count = db_session.execute(stmt).scalar()

    assert users_count == 0


def test_user_update(db_session, make_user):
    user: orm.User = make_user("momo", is_superuser=False)

    assert user.is_superuser == False

    # update user's `is_superuser` to `True`
    attrs = schema.UpdateUser(is_superuser=True)
    dbapi.update_user(db_session, user_id=user.id, attrs=attrs)

    stmt = select(orm.User).where(orm.User.id == user.id)
    updated_user = db_session.execute(stmt).scalar()

    assert updated_user.is_superuser == True


def test_change_password(db_session, make_user):
    user: orm.User = make_user("momo", is_superuser=False)

    initial_password = user.password

    dbapi.change_password(db_session, user_id=user.id, password="updatedpass")

    stmt = select(orm.User).where(orm.User.id == user.id)
    updated_user = db_session.execute(stmt).scalar()

    assert updated_user.password != initial_password


def test__positive__user_belongs_to(db_session, make_user, make_group):
    """In this scenario user belong to one group (familly)"""
    user: orm.User = make_user("momo", is_superuser=False)
    group: orm.Group = make_group("familly")

    user.groups.append(group)
    db_session.add(user)
    db_session.commit()

    assert dbapi.user_belongs_to(db_session, user_id=user.id, group_id=group.id)


def test__negative__user_belongs_to(db_session, make_user, make_group):
    user: orm.User = make_user("momo", is_superuser=False)
    group: orm.Group = make_group("research")

    # user momo does not belong to group "research"
    belongs_to = dbapi.user_belongs_to(db_session, user_id=user.id, group_id=group.id)
    assert not belongs_to
