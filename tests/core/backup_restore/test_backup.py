import tarfile
import time
from unittest.mock import patch
from uuid import uuid4

import pytest
from model_bakery import baker

from papermerge.core.backup_restore import types
from papermerge.core.backup_restore.backup import (Backup, BackupNodes,
                                                   BackupPages, BackupVersions,
                                                   get_backup,
                                                   relative_link_target)
from papermerge.core.backup_restore.types import (Document, DocumentVersion,
                                                  Folder)
from papermerge.core.backup_restore.utils import breadcrumb_to_path
from papermerge.core.pathlib import (docver_path, page_hocr_path,
                                     page_jpg_path, page_svg_path,
                                     page_txt_path)
from papermerge.test.baker_recipes import (document_recipe, folder_recipe,
                                           user_recipe)

pytestmark = pytest.mark.django_db


def test_get_backup():
    """
    Basic assert that get_backup data contains all
    user's nodes

    User username=test1 has the following nodes:
        - .home/
            - My Documents/
                - My Invoice.pdf
        - .inbox/

    This test asserts that
        backup.users[<index of user test1>]['nodes']

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

    backup = get_backup()

    user_test_1 = [
        user
        for user in backup.users
        if user.username == 'test1'
    ][0]
    expected_titles = [node.title for node in user_test_1.nodes]
    expected_breadcrumbs = [
        str(breadcrumb_to_path(node.breadcrumb))
        for node in user_test_1.nodes
    ]

    assert '.inbox' in expected_titles
    assert '.home' in expected_titles
    assert 'My Documents' in expected_titles
    assert 'My Invoice.pdf' in expected_titles

    assert '.inbox' in expected_breadcrumbs
    assert '.home' in expected_breadcrumbs
    assert '.home/My Documents' in expected_breadcrumbs
    assert '.home/My Documents/My Invoice.pdf' in expected_breadcrumbs


def test_backup_nodes_sequence():
    user_recipe.make(username='user1')
    backup = get_backup()
    result = list(BackupNodes(backup))
    expected_tar_info_names = ('user1/.home', 'user1/.inbox')

    assert len(result) == 2
    tar_info_entry1, _ = result[0]
    tar_info_entry2, _ = result[1]

    assert isinstance(tar_info_entry1, tarfile.TarInfo)
    assert isinstance(tar_info_entry2, tarfile.TarInfo)
    assert tar_info_entry1.name in expected_tar_info_names
    assert tar_info_entry2.name in expected_tar_info_names


def test_backup_nodes_sequence_empty_input():
    """Assert that empty input for BackupNodes yields empty results

    i.e. no exceptions are raised (or errors)
    """
    backup = Backup(users=[])
    assert list(BackupNodes(backup)) == []


def test_backup_nodes_sequence_with_one_document_entry():
    user = baker.make('core.user', username='john')
    baker.make(
        'core.Document',
        user=user,
        title="anmeldung.pdf",
        versions=[]
    )

    backup = Backup(users=[user])

    actual = [tar_info.name for tar_info, _ in BackupNodes(backup)]
    assert "john/anmeldung.pdf" in actual


def test_backup_versions_sequence_empty_input():
    user = baker.make('core.user', username='john')
    node1 = Document.model_validate(
        baker.make(
            'core.Document',
            user=user,
            title="document.pdf",
            versions=[]
        )
    )
    node2 = Folder.model_validate(
        baker.make(
            'core.Folder',
            user=user,
            title="My Documents"
        )
    )

    assert list(
        BackupVersions(node1, prefix='username7')
    ) == []
    assert list(
        BackupVersions(node2, prefix='username7')
    ) == []


@patch(
    'papermerge.core.backup_restore.backup.get_content',
    return_value="some content"
)
@patch(
    'papermerge.core.backup_restore.backup.getsize',
    return_value=100
)
@patch(
    'papermerge.core.backup_restore.backup.getmtime',
    return_value=time.time()
)
def test_backup_versions(*_):
    u1 = uuid4()
    u2 = uuid4()

    user = baker.make('core.user', username='john')
    node = Document.model_validate(
        baker.make(
            'core.Document',
            user=user,
            title="anmeldung.pdf",
            parent_id=user.home_folder_id,
            versions=[
                baker.make(
                    'core.DocumentVersion',
                    id=u1,
                    number=1,
                    file_name="anmeldung.pdf"
                ),
                baker.make(
                    'core.DocumentVersion',
                    id=u2,
                    number=2,
                    file_name="anmeldung.pdf"
                )
            ]
        )
    )

    versions_seq = BackupVersions(node, prefix='john')
    actual_result = [(item[0].name, item[0].type) for item in versions_seq]

    expected_result = [
        (str(docver_path(u1, "anmeldung.pdf")), tarfile.REGTYPE),
        (str(docver_path(u2, "anmeldung.pdf")), tarfile.REGTYPE),
        ('john/.home/anmeldung.pdf', tarfile.SYMTYPE)
    ]

    assert set(actual_result) == set(expected_result)


def test_relative_link_target():
    assert "../../../../media/user/v1/doc.pdf" == relative_link_target(
        "home/X/Y/doc.pdf",
        target="media/user/v1/doc.pdf"
    )

    assert "../../../../media/doc.pdf" == relative_link_target(
        "home/X/Y/doc.pdf",
        target="media/doc.pdf"
    )

    assert "../../media/my.pdf" == relative_link_target(
        "home/doc.pdf",
        target="media/my.pdf"
    )

    assert "../../media/my.pdf" == relative_link_target(
        "home/doc.pdf",
        target="media/my.pdf"
    )


def test_backup_pages_empty_input():
    version = build_doc_ver(pages=[])
    assert list(BackupPages(version)) == []


@patch(
    'papermerge.core.backup_restore.backup.exists',
    return_value=True
)
@patch(
    'papermerge.core.backup_restore.backup.getsize',
    return_value=100
)
@patch(
    'papermerge.core.backup_restore.backup.getmtime',
    return_value=time.time()
)
@patch(
    'papermerge.core.backup_restore.backup.get_content',
    return_value="XYZ"
)
def test_backup_pages(*_):
    u1 = uuid4()
    page1 = baker.make('core.Page', id=u1)

    u2 = uuid4()
    page2 = baker.make('core.Page', id=u2)
    version = build_doc_ver(
        pages=[page1, page2]
    )

    actual_result = [
        (item[0].name, item[1]) for item in BackupPages(version)
    ]
    expected_result = [
        (str(page_txt_path(u1)), 'XYZ'),
        (str(page_txt_path(u2)), 'XYZ'),
        (str(page_svg_path(u1)), 'XYZ'),
        (str(page_svg_path(u2)), 'XYZ'),
        (str(page_hocr_path(u1)), 'XYZ'),
        (str(page_hocr_path(u2)), 'XYZ'),
        (str(page_jpg_path(u1)), 'XYZ'),
        (str(page_jpg_path(u2)), 'XYZ'),
    ]

    assert set(actual_result) == set(expected_result)


def test_pyuser_with_tags():
    """
    Create a user with some tags and check that types.User instance
    has those tag names
    """
    user = baker.make('core.user', username='john')
    baker.make('core.tag', user=user, name="red")
    baker.make('core.tag', user=user, name="green")

    pyuser = types.User.model_validate(user)

    user_all_tag_names = [tag.name for tag in pyuser.tags]
    assert 'red' in user_all_tag_names
    assert 'green' in user_all_tag_names


def build_doc_ver(**kwargs):
    return DocumentVersion.model_validate(
        baker.make('core.DocumentVersion', **kwargs)
    )
