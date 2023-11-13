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


def test_that_doc_and_folder_hierarchy_is_preserved(backup_1):
    """
    Restore DB from backup and check if docs/folders hierarchy was preserved
    """
    pyuser = backup_1.users[0]
    # restore DB from backup
    restore_users([pyuser])
    created_user = models.User.objects.get(username='admin')

    assert models.Folder.objects.get_by_breadcrumb(
        ".home/My Documents/Contracts",
        created_user
    )

    assert models.Folder.objects.get_by_breadcrumb(
        ".home/Empty",
        created_user
    )

    assert models.Document.objects.get_by_breadcrumb(
        ".home/My Documents/Contracts/important-thing.pdf",
        created_user
    )

    with pytest.raises(models.Folder.DoesNotExist):
        models.Folder.objects.get_by_breadcrumb(
            ".home/I/Dont/Exist",
            created_user
        )

    # this was added because of real bug which resulted
    # in duplicate folder creations
    with pytest.raises(models.Folder.DoesNotExist):
        models.Folder.objects.get_by_breadcrumb(
            ".home/My Documents/My Documents",
            created_user
        )


def test_restore_with_tags(backup_with_tags):
    pyuser = backup_with_tags.users[0]
    # restore DB from backup
    restore_users([pyuser])

    user = models.User.objects.get(username='admin')
    user_tags = {tag.name for tag in user.tags.all()}
    assert {"green", "red", "blue"} == user_tags

    clients_folder = models.Folder.objects.get_by_breadcrumb(
        ".home/Clients",
        user
    )
    clients_folder_tags = {tag.name for tag in clients_folder.tags.all()}
    assert {"green"} == clients_folder_tags

    doc1 = models.Document.objects.get_by_breadcrumb(
        ".home/Clients/brother_008261.pdf",
        user
    )
    assert {"blue", "green"} == {tag.name for tag in doc1.tags.all()}

    doc2 = models.Document.objects.get_by_breadcrumb(
        ".home/brother_008263.pdf",
        user
    )
    assert {"red"} == {tag.name for tag in doc2.tags.all()}
