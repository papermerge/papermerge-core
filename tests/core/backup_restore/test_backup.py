import pytest

from papermerge.core.backup_restore.backup import dump_data_as_dict
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
