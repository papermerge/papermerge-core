from pathlib import PurePath

import pytest
from model_bakery import baker

from papermerge.core import models
from papermerge.core.backup_restore import utils

pytestmark = pytest.mark.django_db


def test_restore_sequence():
    input = [
        {'breadcrumb': '.home/'},
        {'breadcrumb': '.home/A/'},
        {'breadcrumb': '.home/A/B/'},
        {'breadcrumb': '.home/doc.pdf'},
        {'breadcrumb': '.inbox/'},
    ]
    actual_output = [
        item['breadcrumb'] for item in utils.RestoreSequence(input)
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
    assert 1 == utils.breadcrumb_parts_count(
        {"breadcrumb": ".home/"}
    )
    assert 2 == utils.breadcrumb_parts_count(
        {"breadcrumb": ".home/A/"}
    )
    assert 4 == utils.breadcrumb_parts_count(
        {"breadcrumb": ".home/A/B/C"}
    )
    assert 3 == utils.breadcrumb_parts_count(
        {"breadcrumb": ".home/A/doc.pdf"}
    )
    assert 1 == utils.breadcrumb_parts_count(
        {"breadcrumb": ".inbox/"}
    )
    assert 2 == utils.breadcrumb_parts_count(
        {"breadcrumb": ".inbox/doc.pdf"}
    )


def test_ctype():
    assert utils.CType.FOLDER.value == 'folder'
    assert utils.CType.FOLDER != 'folder'
    assert utils.CType.DOCUMENT.value == 'document'
    assert utils.CType.DOCUMENT != 'document'


def test_mkdir_home_or_inbox():
    """
    When mkdir receives `.home` path (or `.inbox`), it must return
    matching user's home folder.
    """
    user = baker.make('core.user')
    home = utils.mkdir(
        PurePath(models.Folder.HOME_TITLE),
        user=user,
        parent=None
    )
    inbox = utils.mkdir(
        PurePath(models.Folder.INBOX_TITLE),
        user=user,
        parent=None
    )

    assert home == user.home_folder
    assert inbox == user.inbox_folder


def test_mkdir_one_folder():
    """
    Test basic scenario for utils.mkdir
    """
    user = baker.make('core.user')
    created = utils.mkdir(
        PurePath(".home/My Documents"),
        user=user,
        parent=user.home_folder
    )

    found = models.Folder.objects.get_by_breadcrumb(
        ".home/My Documents",
        user=user
    )

    assert found == created


def test_mkdirs():
    user = baker.make('core.user')
    utils.mkdirs(
        PurePath(".home/All/My Documents/Are/Blue"),
        user=user
    )

    assert models.Folder.objects.get_by_breadcrumb(
        ".home/All/My Documents",
        user=user
    )
    assert models.Folder.objects.get_by_breadcrumb(
        ".home/All/My Documents/Are",
        user=user
    )
    assert models.Folder.objects.get_by_breadcrumb(
        ".home/All/My Documents/Are/Blue",
        user=user
    )
