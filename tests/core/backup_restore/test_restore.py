import pytest

from papermerge.core.backup_restore.restore import (
    restore_folder,
    RestoreSequence,
    breadcrumb_parts_count
)

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


def test_restore_sequence():
    input = [
        {'breadcrumb': '.home/'},
        {'breadcrumb': '.home/A/'},
        {'breadcrumb': '.home/A/B/'},
        {'breadcrumb': '.home/doc.pdf'},
        {'breadcrumb': '.inbox/'},
    ]
    actual_output = [
        item['breadcrumb'] for item in RestoreSequence(input)
    ]
    expected_output = [
        '.home/',
        '.inbox/',
        '.home/A/',
        '.home/doc.pdf',
        '.home/A/B/',
    ]

    assert expected_output == list(actual_output)


def test_breadcrumb_parts_count():
    assert 1 == breadcrumb_parts_count(
        {"breadcrumb": ".home/"}
    )
    assert 2 == breadcrumb_parts_count(
        {"breadcrumb": ".home/A/"}
    )
    assert 4 == breadcrumb_parts_count(
        {"breadcrumb": ".home/A/B/C"}
    )
    assert 3 == breadcrumb_parts_count(
        {"breadcrumb": ".home/A/doc.pdf"}
    )
    assert 1 == breadcrumb_parts_count(
        {"breadcrumb": ".inbox/"}
    )
    assert 2 == breadcrumb_parts_count(
        {"breadcrumb": ".inbox/doc.pdf"}
    )
