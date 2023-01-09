import pytest

from papermerge.core.backup_restore import UserDataIter, get_users_data
from papermerge.core.backup_restore import UserFileIter
from papermerge.test.baker_recipes import user_recipe, folder_recipe, \
    document_recipe, document_version_recipe


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
