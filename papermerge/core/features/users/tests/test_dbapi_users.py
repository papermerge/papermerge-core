from sqlalchemy import func, select

from papermerge.core.features.users.db import api as dbapi
from papermerge.core.features.users.db import orm


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
