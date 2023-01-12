import pytest

from papermerge.core.backup_restore import UserDataIter, get_users_data, \
    restore_folder, RestoreSequence, breadcrumb_parts_count
from papermerge.core.backup_restore import UserFileIter
from papermerge.test.baker_recipes import user_recipe, folder_recipe, \
    document_recipe, document_version_recipe, make_folders


@pytest.mark.django_db
def test_user_data_iter():
    user_recipe.make(username='test1')
    user_recipe.make(username='test2')

    result = [user['username'] for user in UserDataIter()]

    # indeed there are two users
    assert len(result) == 2
    # first user is in results
    assert 'test1' in result
    # second user is in result
    assert 'test2' in result

    # and this is how we get inbox id
    some_inbox_folder_dict = list(UserDataIter())[0]['inbox_folder']
    assert 'id' in some_inbox_folder_dict.keys()


@pytest.mark.django_db
def test_get_user_data():
    u1 = user_recipe.make(username='test1')
    user_recipe.make(username='test2')
    mydocs = folder_recipe.make(
        title='My Documents',
        parent=u1.home_folder
    )
    document_recipe.make(
        title='My Invoice.pdf',
        parent=mydocs
    )

    schema_dict = get_users_data()

    user_test_1 = [
        user
        for user in schema_dict
        if user['username'] == 'test1'
    ][0]
    expected_titles = [node['title'] for node in user_test_1['nodes']]

    assert '.inbox' in expected_titles
    assert '.home' in expected_titles
    assert 'My Documents' in expected_titles
    assert 'My Invoice.pdf' in expected_titles


@pytest.mark.django_db
def test_user_file_iter():
    """
    Build and iterave over following hierarchy:
    - username1  <- user, owner of the docs and folders
        - .inbox <- empty
        - .home
            - My Documents
                - My Invoice.pdf

    It is expected that empty folder .inbox will also be included
    in the archive
    """
    u1 = user_recipe.make(username='username1')
    mydocs = folder_recipe.make(
        title='My Documents',
        parent=u1.home_folder,
        user=u1
    )
    doc = document_recipe.make(
        title='My Invoice.pdf',
        parent=mydocs,
        user=u1
    )
    document_version_recipe.make(document=doc)
    actual_results = [breadcrumb for _, breadcrumb, _ in UserFileIter()]

    expected_results = [
        'username1/.home',
        'username1/.home/My Documents',
        'username1/.home/My Documents/My Invoice.pdf',
        # empty folder will be included in the results as well
        'username1/.inbox'
    ]

    assert set(expected_results) == set(actual_results), actual_results


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
