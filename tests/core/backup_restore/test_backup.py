import time
import tarfile
from unittest.mock import patch

import pytest

from papermerge.core.backup_restore.utils import CType
from papermerge.core.backup_restore.backup import (
    dump_data_as_dict,
    BackupNodes,
    BackupVersions,
    BackupPages,
    relative_link_target
)
from papermerge.test.baker_recipes import (
    user_recipe,
    folder_recipe,
    document_recipe
)


@pytest.mark.django_db
def test_dump_data_as_dict():
    """
    Basic assert that dict data dump contains all
    user's nodes

    User username=test1 has following nodes:
        - .home/
            - My Documents/
                - My Invoice.pdf
        - .inbox/

    This test asserts that
        dump_dict['users'][<index of user test1>]['nodes']

    contains
    1. titles of all user's nodes i.e. '.home', '.inbox',
        'My Documents', 'My Invoice.pdf'
    2. breadcrumbs of all user's nodes i.e. '.home', '.inbox',
    '.home/My Documents', '.home/My Documents/My Invoice.pdf
    """
    user_test1 = user_recipe.make(username='test1')
    user_recipe.make(username='test2')
    mydocs = folder_recipe.make(
        title='My Documents',
        parent=user_test1.home_folder,
        user=user_test1
    )
    document_recipe.make(
        title='My Invoice.pdf',
        parent=mydocs,
        user=user_test1
    )

    data_dict = dump_data_as_dict()

    user_test_1 = [
        user
        for user in data_dict['users']
        if user['username'] == 'test1'
    ][0]
    expected_titles = [node['title'] for node in user_test_1['nodes']]
    expected_breadcrumbs = [
        node['breadcrumb'] for node in user_test_1['nodes']
    ]

    assert '.inbox' in expected_titles
    assert '.home' in expected_titles
    assert 'My Documents' in expected_titles
    assert 'My Invoice.pdf' in expected_titles

    assert '.inbox/' in expected_breadcrumbs
    assert '.home/' in expected_breadcrumbs
    assert '.home/My Documents/' in expected_breadcrumbs
    assert '.home/My Documents/My Invoice.pdf' in expected_breadcrumbs


def test_backup_nodes_sequence():
    backup_dict = {
        'users': [
            {
                'username': 'user1',
                'nodes': [
                    {'breadcrumb': '.home', 'ctype': CType.FOLDER},
                    {'breadcrumb': '.inbox', 'ctype': CType.FOLDER},
                ]
            }
        ]
    }
    result = list(BackupNodes(backup_dict))
    expected_tar_info_names = ('user1/.home', 'user1/.inbox')

    assert len(result) == 2
    tar_info_entry1, _ = result[0]
    tar_info_entry2, _ = result[1]

    assert isinstance(tar_info_entry1, tarfile.TarInfo)
    assert isinstance(tar_info_entry2, tarfile.TarInfo)
    assert tar_info_entry1.name in expected_tar_info_names
    assert tar_info_entry2.name in expected_tar_info_names


def test_backup_nodes_sequence_empty_input():
    """Assert that empty input for BackupNodes yields empty results

    i.e. no exceptions are raised (or errors)
    """
    assert list(BackupNodes({})) == []
    assert list(BackupNodes({'users': []})) == []

    # empty -  in sens that nodes list is empty
    empty_input = {
        'users': [
            {'nodes': [], 'username': 'john'},
        ]
    }
    assert list(BackupNodes(empty_input)) == []


def test_backup_nodes_sequence_with_one_document_entry():
    input_dict = {
        'users': [
            {'nodes': [
                {
                    'breadcrumb': '.home/anmeldung.pdf',
                    'ctype': CType.DOCUMENT,
                    'versions': []
                }
            ], 'username': 'john'},
        ]
    }

    for tar_info, _ in BackupNodes(input_dict):
        assert tar_info.isreg()
        # name of the tarfile.TarInfo is prefixed
        # with user.username i.e. 'john' in this scenario
        assert tar_info.name == 'john/.home/anmeldung.pdf'


def test_backup_versions_sequence_empty_input():
    node_dict_1 = {
        'breadcrumb': '.home/',
        'ctype': CType.FOLDER
    }

    node_dict_2 = {
        'breadcrumb': '.home/document.pdf',
        'ctype': CType.DOCUMENT,
        'versions': []  # empty versions
    }

    assert list(
        BackupVersions(node_dict_1, prefix='username7')
    ) == []
    assert list(
        BackupVersions(node_dict_2, prefix='username7')
    ) == []


@patch(
    'papermerge.core.backup_restore.backup.get_content',
    return_value="some content"
)
@patch(
    'papermerge.core.backup_restore.backup.getsize',
    return_value=100
)
@patch(
    'papermerge.core.backup_restore.backup.getmtime',
    return_value=time.time()
)
def test_backup_versions(*_):
    node_dict = {
        'breadcrumb': '.home/My Documents/doc.pdf',
        'ctype': CType.DOCUMENT,
        'versions': [
            {
                'file_path': 'media/docs/v1/doc.pdf',
                'number': 1
            },
            {
                'file_path': 'media/docs/v2/doc.pdf',
                'number': 2
            }
        ]
    }

    versions_seq = BackupVersions(node_dict, prefix='john')
    actual_result = [(item[0].name, item[0].type) for item in versions_seq]
    expected_result = [
        ('media/docs/v1/doc.pdf', tarfile.REGTYPE),
        ('media/docs/v2/doc.pdf', tarfile.REGTYPE),
        ('john/.home/My Documents/doc.pdf', tarfile.SYMTYPE)
    ]

    assert set(actual_result) == set(expected_result)


def test_relative_link_target():
    assert "../../../../media/user/v1/doc.pdf" == relative_link_target(
        "home/X/Y/doc.pdf",
        target="media/user/v1/doc.pdf"
    )

    assert "../../../../media/doc.pdf" == relative_link_target(
        "home/X/Y/doc.pdf",
        target="media/doc.pdf"
    )

    assert "../../media/my.pdf" == relative_link_target(
        "home/doc.pdf",
        target="media/my.pdf"
    )

    assert "../../media/my.pdf" == relative_link_target(
        "home/doc.pdf",
        target="media/my.pdf"
    )


def test_backup_pages_empty_input():
    version_dict = {
        'pages': []
    }
    assert list(BackupPages(version_dict)) == []
    assert list(BackupPages({})) == []


@patch(
    'papermerge.core.backup_restore.backup.exists',
    return_value=True
)
@patch(
    'papermerge.core.backup_restore.backup.getsize',
    return_value=100
)
@patch(
    'papermerge.core.backup_restore.backup.getmtime',
    return_value=time.time()
)
@patch(
    'papermerge.core.backup_restore.backup.get_content',
    return_value="XYZ"
)
def test_backup_pages(*_):
    version_dict = {
        'pages': [
            {'file_path': 'some/path/to/file_1.pdf'},
            {'file_path': 'some/path/to/file_2.pdf'}
        ]
    }
    actual_result = [
        (item[0].name, item[1]) for item in BackupPages(version_dict)
    ]
    expected_result = [
        ('some/path/to/file_1.pdf', 'XYZ'),
        ('some/path/to/file_2.pdf', 'XYZ')
    ]

    assert set(actual_result) == set(expected_result)
