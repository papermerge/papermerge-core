import pytest

from papermerge.core.backup_restore.backup import dump_data_as_dict
from papermerge.test.baker_recipes import (
    user_recipe,
    folder_recipe,
    document_recipe
)


@pytest.mark.django_db
def test_dump_data_as_dict():
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

    data_dict = dump_data_as_dict()

    user_test_1 = [
        user
        for user in data_dict['users']
        if user['username'] == 'test1'
    ][0]
    expected_titles = [node['title'] for node in user_test_1['nodes']]

    assert '.inbox' in expected_titles
    assert '.home' in expected_titles
    assert 'My Documents' in expected_titles
    assert 'My Invoice.pdf' in expected_titles
