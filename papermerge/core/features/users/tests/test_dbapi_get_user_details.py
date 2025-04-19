from papermerge.core import orm, dbapi


def test_user_groups(db_session, make_user, make_group):
    """User details should return all user's groups"""
    user: orm.User = make_user("momo", is_superuser=False)
    group: orm.Group = make_group("family")

    user.groups.append(group)
    db_session.add(user)
    db_session.commit()

    user_details, err = dbapi.get_user_details(db_session, user.id)

    assert err is None
    assert "family" in [g.name for g in user_details.groups]


def test_user_roles(db_session, make_user, make_role):
    """User details should return all user's roles"""
    user: orm.User = make_user("momo", is_superuser=False)
    role: orm.Role = make_role("employee")

    user.roles.append(role)
    db_session.add(user)
    db_session.commit()

    user_details, err = dbapi.get_user_details(db_session, user.id)

    assert err is None
    assert "employee" in [r.name for r in user_details.roles]


def test_user_scopes(db_session, make_user, make_role):
    """User details should return all user's scopes"""
    dbapi.sync_perms(db_session)
    user: orm.User = make_user("momo", is_superuser=False)
    role: orm.Role = make_role("employee", scopes=["node.create", "node.view"])

    user.roles.append(role)
    db_session.add(user)
    db_session.commit()

    user_details, err = dbapi.get_user_details(db_session, user.id)

    assert err is None
    assert "node.create" in [scope for scope in user_details.scopes]
    assert "node.view" in [scope for scope in user_details.scopes]
