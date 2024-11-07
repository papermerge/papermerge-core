import pytest

from papermerge.core import orm


@pytest.fixture()
def make_tag(db_session):
    def _maker(
        name: str, user: orm.User, bg_color: str = "red", fg_color: str = "white"
    ):
        db_tag = orm.Tag(
            name=name, bg_color=bg_color, fg_color=fg_color, user_id=user.id
        )
        db_session.add(db_tag)
        db_session.commit()

        return db_tag

    return _maker
