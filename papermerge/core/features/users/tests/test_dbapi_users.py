from sqlalchemy import func, select

from papermerge.core.features.users.db import api as dbapi
from papermerge.core.features.users.db import orm
from papermerge.core.features.users import schema as usr_schema


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
    attrs = usr_schema.UpdateUser(is_superuser=True)
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
