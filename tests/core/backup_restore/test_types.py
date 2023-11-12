import pytest

from papermerge.core import models
from papermerge.core.backup_restore import types
from papermerge.test.baker_recipes import folder_recipe

pytestmark = pytest.mark.django_db


def test_dict_to_pyfolder():
    folder = {
        "title": ".home",
        "ctype": "folder",
        "created_at": "2023-11-11 06:22:08.978855+00:00",
        "updated_at": "2023-11-11 06:22:08.978856+00:00",
        "breadcrumb": [
            ".home",
            "My Documents"
        ]
    }

    pyfol = types.Folder(**folder)
    assert pyfol.breadcrumb == [".home", "My Documents"]


def test_folder_to_pyfolder(user: models.User):
    folder1 = folder_recipe.make(
        title='folder1',
        user=user,
        parent=user.home_folder
    )
    folder = folder_recipe.make(
        title='folder2',
        user=user,
        parent=folder1
    )

    pyfolder = types.Folder.model_validate(folder)
    assert pyfolder.breadcrumb == ['.home', 'folder1', 'folder2']
