import uuid
import pytest

from papermerge.core.models.utils import (
    uuid2raw_str,
    get_by_breadcrumb
)
from papermerge.core.models import BaseTreeNode, Folder, Document
from papermerge.test.baker_recipes import user_recipe, document_recipe


def test_uuid2raw_str_1():
    value = uuid.UUID('fb3b40b3-9d52-4681-86d0-a662f290d52c')
    expected_result = 'fb3b40b39d52468186d0a662f290d52c'
    actual_result = uuid2raw_str(value)

    assert actual_result == expected_result


def test_uuid2raw_str_2():
    value = uuid.UUID('175828f4-13f9-4f8b-8c27-125e2c744feb')
    expected_result = '175828f413f94f8b8c27125e2c744feb'
    actual_result = uuid2raw_str(value)

    assert actual_result == expected_result


def test_uuid2raw_garbage_input():

    with pytest.raises(ValueError):
        uuid2raw_str(None)

    with pytest.raises(ValueError):
        uuid2raw_str('')


@pytest.mark.django_db
def test_get_by_breadcrumb():
    user = user_recipe.make()
    with pytest.raises(ValueError):
        # as first argument either Document or Folder
        # classes are expected
        get_by_breadcrumb(BaseTreeNode, 'not important here', user)


@pytest.mark.django_db
def test_get_by_breadcrumb_folder():
    user = user_recipe.make()
    found = get_by_breadcrumb(Folder, '.home/', user)
    assert found is not None


@pytest.mark.django_db
def test_get_by_breadcrumb_document():
    user = user_recipe.make()
    document_recipe.make(
        title='document.pdf',
        user=user,
        parent=user.home_folder
    )
    found = get_by_breadcrumb(Document, '.home/document.pdf', user)
    assert found is not None
    assert found.title == 'document.pdf'
