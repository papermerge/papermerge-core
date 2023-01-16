import tarfile

import pytest

from papermerge.core.backup_restore.utils import CType
from papermerge.core.backup_restore.backup import (
    dump_data_as_dict,
    BackupNodes
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
                {'breadcrumb': '.home/anmeldung.pdf', 'ctype': CType.DOCUMENT}
            ], 'username': 'john'},
        ]
    }

    for tar_info, _ in BackupNodes(input_dict):
        assert tar_info.isreg()
        # name of the tarfile.TarInfo is prefixed
        # with user.username i.e. 'john' in this scenario
        assert tar_info.name == 'john/.home/anmeldung.pdf'
