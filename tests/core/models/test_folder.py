import pytest
from django.db import transaction
from django.db.utils import IntegrityError

from papermerge.core.models import Folder, User
from papermerge.test.baker_recipes import folder_recipe
from papermerge.test.testcases import TestCase
from papermerge.test.utils import breadcrumb_fmt


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

        self.assertTrue(isinstance(user.home_folder, Folder))
        self.assertTrue(isinstance(user.inbox_folder, Folder))
        self.assertEqual(user.home_folder.title, Folder.HOME_TITLE)
        self.assertTrue(user.inbox_folder, Folder.INBOX_TITLE)

    def test_idified_title(self):
        folder = Folder.objects.create(title="My Documents", user=self.user)

        self.assertEqual(f"My Documents-{folder.id}", folder.idified_title)

    def test_that_folder_can_be_saved_in_real_inbox(self):
        """
        Make sure that creating a folder in user's inbox does not raise
        an exception.
        """
        Folder.objects.create(
            title="My Documents", user=self.user, parent=self.user.inbox_folder
        )
        assert self.user.inbox_folder.children.count() == 1

    def test_two_folders_with_same_title_under_same_parent(self):
        """It should not be possible to create two folders with
        same (parent, title) pair i.e. we cannot have folders with same
        title under same parent
        """
        Folder.objects.create(
            title="My Documents", user=self.user, parent=self.user.inbox_folder
        )
        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                Folder.objects.create(
                    title="My Documents", user=self.user, parent=self.user.inbox_folder
                )

    def test_only_one_home_per_user(self):
        # at this point there is exactly one .home folder per user
        assert Folder.objects.get(title=Folder.HOME_TITLE, user=self.user)
        # Following method should raise an integrity error
        # as same user cannot have two .home (i.e. Folder.HOME_TITLE) folders!
        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                Folder.objects.create(
                    user=self.user,
                    parent=None,  # .home is top most folder
                    title=Folder.HOME_TITLE,
                )

    def test_two_users_can_have_same_identical_titles_for_home(self):
        user2 = User.objects.create_user(username="user2")
        user3 = User.objects.create_user(username="user3")

        # user2 has home folder titled Folder.HOME_TITLE
        assert Folder.objects.get(title=Folder.HOME_TITLE, user=user2)
        # users has home folder titled Folder.HOME_TITLE as well
        assert Folder.objects.get(title=Folder.HOME_TITLE, user=user3)
        # but recreating Folder.HOME_TITLE for user2/user3 is not allowed
        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                Folder.objects.create(
                    user=user2,
                    parent=None,  # .home is top most folder
                    title=Folder.HOME_TITLE,
                )

        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                Folder.objects.create(
                    user=user3,
                    parent=None,  # .home is top most folder
                    title=Folder.HOME_TITLE,
                )

    def test_top_level_duplicate_titles_not_allowed(self):
        """Top level duplicate titles per user are not allowed

        However, different user can have same top level node titles
        e.g. ".home", ".inbox" etc
        """
        Folder.objects.create(
            title="top-level-folder",
            user=self.user,
            parent=None,  # top level folder
        )
        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                Folder.objects.create(
                    title="top-level-folder",  # duplicate top level title
                    user=self.user,
                    parent=None,  # top level folder
                )
        # however, creating 'top-level-folder' for user2 is OK
        user2 = User.objects.create_user(username="user2")
        folder = Folder.objects.create(
            title="top-level-folder",
            user=user2,  # user2 != self.user
            parent=None,  # top level folder
        )

        assert folder.title == "top-level-folder"

    def test_two_folders_with_same_title_under_different_parents(self):
        """It should be possible to create two folders with
        same title under different parents
        """
        Folder.objects.create(
            title="My Documents", user=self.user, parent=self.user.inbox_folder
        )
        Folder.objects.create(
            title="My Documents",  # same title
            user=self.user,
            parent=self.user.home_folder,  # different parent
        )


@pytest.mark.django_db
def test_delete_folder_with_sub_folders():
    """Make sure that deleting folder with sub-nodes does
    not throw an exception.

    This scenario creates one folder which contains sub-nodes
    i.e. a folder which contains a couple of folders.
    `folder.delete` should NOT throw an exception.
    """
    folder = folder_recipe.make()
    sub1 = folder_recipe.make(user=folder.user, parent=folder)
    folder_recipe.make(user=folder.user, parent=sub1)
    # we created 3 folders, plus
    # home and inbox folders which are automatically created
    # for the user
    assert Folder.objects.count() == 5

    # this is what is tested
    folder.delete()
    left_titles = Folder.objects.values_list("title", flat=True)

    # only home and inbox folder are left
    assert Folder.objects.count() == 2

    expected_left_titles = {Folder.HOME_TITLE, Folder.INBOX_TITLE}

    assert expected_left_titles == set(left_titles)


@pytest.mark.django_db
def test_folder_breadcrumb(user: User):
    folder1 = folder_recipe.make(title="folder1", user=user, parent=user.home_folder)
    folder = folder_recipe.make(title="folder2", user=user, parent=folder1)

    actual_breadcrumb = breadcrumb_fmt(folder.breadcrumb) + "/"

    assert ".home/folder1/folder2/" == actual_breadcrumb
    assert folder.title == "folder2"
