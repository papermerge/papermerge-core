import pytest

from papermerge.core import models
from papermerge.core.backup_restore.restore import restore_users


@pytest.mark.django_db
def test_restore(list_with_one_user):
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
