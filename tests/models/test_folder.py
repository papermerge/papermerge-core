from papermerge.test import TestCase
from papermerge.core.models import User, Folder


class TestFolderModel(TestCase):

    def test_special_folders_are_automatically_created(self):
        """
        Assert that whenever a `core.User` is created, it gets automatically
        two special folders:
            1. home
            2. inbox
        """
        user = User.objects.create_user(username="user1")

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
