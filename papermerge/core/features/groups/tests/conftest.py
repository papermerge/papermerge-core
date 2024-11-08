import pytest
from papermerge.core import orm


@pytest.fixture()
def make_group(db_session):
    def _maker(name: str):
        group = orm.Group(name=name)
        db_session.add(group)
        db_session.commit()
        return group

    return _maker
