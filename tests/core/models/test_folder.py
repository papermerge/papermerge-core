from django.db.utils import IntegrityError
from django.db import transaction
from papermerge.test import TestCase
from papermerge.core.models import User, Folder


class TestFolderModel(TestCase):

    def setUp(self):
        self.user = User.objects.create_user(username="user1")

    def test_special_folders_are_automatically_created(self):
        """
        Assert that whenever a `core.User` is created, it gets automatically
        two special folders:
            1. home
            2. inbox
        """
        user = User.objects.create_user(username="user2")

        self.assertTrue(
            isinstance(user.home_folder, Folder)
        )
        self.assertTrue(
            isinstance(user.inbox_folder, Folder)
        )
        self.assertEqual(
            user.home_folder.title, Folder.HOME_TITLE
        )
        self.assertTrue(
            user.inbox_folder, Folder.INBOX_TITLE
        )

    def test_idified_title(self):
        folder = Folder.objects.create(
            title='My Documents',
            user=self.user
        )

        self.assertEqual(
            f'My Documents-{folder.id}',
            folder.idified_title
        )

    def test_that_folder_can_be_saved_in_real_inbox(self):
        """
        Make sure that creating a folder in user's inbox does not raise
        an exception.
        """
        Folder.objects.create(
            title='My Documents',
            user=self.user,
            parent=self.user.inbox_folder
        )
        assert self.user.inbox_folder.children.count() == 1

    def test_two_folders_with_same_title_under_same_parent(self):
        """It should not be possible to create to folders with
        same (parent, title) pair i.e. we cannot have folders with same
        title under same parent
        """
        Folder.objects.create(
            title='My Documents',
            user=self.user,
            parent=self.user.inbox_folder
        )
        with transaction.atomic():
            with self.assertRaises(IntegrityError):
                Folder.objects.create(
                    title='My Documents',
                    user=self.user,
                    parent=self.user.inbox_folder
                )

    def test_two_folders_with_same_title_under_different_parent(self):
        """It should be possible to create to folders with
        same title under different parents
        """
        Folder.objects.create(
            title='My Documents',
            user=self.user,
            parent=self.user.inbox_folder
        )
        Folder.objects.create(
            title='My Documents',  # same title
            user=self.user,
            parent=self.user.home_folder  # different parent
        )
