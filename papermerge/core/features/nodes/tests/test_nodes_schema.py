from papermerge.core import schema
from papermerge.core import orm
from papermerge.core import constants as const


def test_basic_home_folder(user: orm.User):
    folder = schema.Folder.model_validate(user.home_folder)

    assert folder.title == const.HOME_TITLE
    assert folder.ctype == const.CTYPE_FOLDER
