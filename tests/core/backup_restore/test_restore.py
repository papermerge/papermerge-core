import pytest

from papermerge.core.backup_restore.restore import restore_folder

from papermerge.test.baker_recipes import (
    user_recipe,
    make_folders
)


@pytest.mark.django_db
def test_restore_folder():
    u1 = user_recipe.make(username='username1')
    node_dict = {
        'title': 'My Documents',
        'id': 'blah',
        'breadcrumb': '.home/My Documents/',
        'parent': {
            'type': 'folders',
            'id': 'blah'
        },
        'tags': [],
        'created_at': '2023-01-06T06:46:08.279858+01:00',
        'updated_at': '2023-01-06T06:46:08.279898+01:00'
    }
    folder = restore_folder(node_dict, u1)

    assert folder is not None
    assert folder.title == 'My Documents'
    assert folder.parent is not None
    assert folder.parent.id == u1.home_folder.id


@pytest.mark.django_db
def test_restore_folder_deeply_nested():
    u1 = user_recipe.make(username='username1')
    node_dict = {
        'title': 'My Documents',
        'id': 'blah',
        'breadcrumb': '.home/My Documents/My Invoices/Private/',
        'parent': {
            'type': 'folders',
            'id': 'blah'
        },
        'tags': [],
        'created_at': '2023-01-06T06:46:08.279858+01:00',
        'updated_at': '2023-01-06T06:46:08.279898+01:00'
    }
    make_folders(".home/My Documents/My Invoices/", user=u1)
    folder = restore_folder(node_dict, u1)

    assert folder is not None
    assert folder.title == 'Private'
    assert folder.parent is not None
    assert ".home/My Documents/My Invoices/Private/" == folder.breadcrumb
