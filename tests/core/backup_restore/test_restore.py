import pytest

from papermerge.core import models
from papermerge.core.backup_restore.restore import restore_user, restore_users

pytestmark = pytest.mark.django_db


def test_restore(list_with_one_user):
    """very basic test, just asserts that functions goes through"""
    # before there are no users
    assert models.User.objects.count() == 0

    # restore list contains one user
    restore_users(list_with_one_user)

    # now there should be on user in DB
    assert models.User.objects.count() == 1
    assert models.Document.objects.count() == 1
    assert models.Folder.objects.count() == 2

    doc = models.Document.objects.get(title="4-page-doc.pdf")
    assert doc.versions.count() == 2
    last_ver = doc.versions.last()
    assert "Meine Katze" in last_ver.text


def test_restore_user(pyjohn):
    """very basic test"""
    created_user, was_created = restore_user(pyjohn)

    assert was_created is True
    assert created_user.username == 'john'
    user = models.User.objects.get(username='john')
    assert user
    assert user.home_folder.title == '.home'
    assert user.inbox_folder.title == '.inbox'


def test_that_folder_hierarchy_is_preserved(backup_1):
    """
    Restore DB from backup and check if docs/folders hierarchy was preserved
    """
    pyuser = backup_1.users[0]
    # restore DB from backup
    created_user, was_created = restore_user(pyuser)

    found_doc = models.Document.objects.get_by_breadcrumb(
        ".home/My Documents/Contracts/important-thing.pdf",
        created_user
    )

    assert found_doc
