import pytest

from papermerge.core.features.tags.db import orm
from papermerge.core.features.tags import schema as tags_schema
from papermerge.core.features.users.db import orm as usr_orm


@pytest.fixture()
def make_tag(db_session):
    def _maker(
        name: str, user: usr_orm.User, bg_color: str = "red", fg_color: str = "white"
    ):
        db_tag = orm.Tag(
            name=name, bg_color=bg_color, fg_color=fg_color, user_id=user.id
        )
        db_session.add(db_tag)
        db_session.commit()

        return tags_schema.Tag.model_validate(db_tag)

    return _maker
