import pytest

from papermerge.core.backup_restore import UserSchemaIter
from papermerge.test.baker_recipes import user_recipe


@pytest.mark.django_db
def test_user_schema_iter():
    user_recipe.make(username='test1')
    user_recipe.make(username='test2')

    result = [user['username'] for user in UserSchemaIter()]

    assert len(result) == 2
    assert 'test1' in result
    assert 'test2' in result
