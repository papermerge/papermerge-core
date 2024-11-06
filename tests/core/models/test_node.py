import pytest

from papermerge.core.models import BaseTreeNode, Document, Folder, User
from papermerge.core.models.node import NODE_TYPE_DOCUMENT, NODE_TYPE_FOLDER
from papermerge.test.baker_recipes import folder_recipe, make_folders, user_recipe
from papermerge.test.testcases import TestCase


class TestNodeModel(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="user1")

    def test_get_tags_via_node(self):
        """
        Tags added via Folder instance may be retrieved via corresponding
        Node instance (BaseTreeNode).
        """
        folder = Folder.objects.create(
            title="My Documents", user=self.user, parent=self.user.inbox_folder
        )

        folder.tags.set(  # set tags via Folder instance
            ["folder_a", "folder_b"], tag_kwargs={"user": self.user}
        )

        folder.refresh_from_db()
        assert folder.tags.count() == 2

        node = BaseTreeNode.objects.get(pk=folder.pk)

        assert node.folder.tags.count() == 2
        # Now retrieve tags via Node (BaseTreeNode) model
        assert node.tags.count() == 2

    def test_node_ctype_for_folder(self):
        """
        assert that node's ctype field is set correctly.

        `node.ctype` is shortcut to figure out without extra joins
        what type is this node - is it a document? is it a folder?
        """
        f1 = Folder.objects.create(
            title="My Documents", user=self.user, parent=self.user.inbox_folder
        )
        node = BaseTreeNode.objects.get(pk=f1.pk)

        assert node.ctype == NODE_TYPE_FOLDER
        assert node.is_folder is True

    def test_node_ctype_for_document(self):
        """
        assert that node's ctype field is set correctly.

        `node.ctype` is shortcut to figure out without extra joins
        what type is this node - is it a document? is it a folder?
        """
        doc = Document.objects.create_document(
            title="three-pages.pdf",
            lang="deu",
            user_id=self.user.pk,
            parent=self.user.home_folder,
        )
        node = BaseTreeNode.objects.get(pk=doc.pk)

        assert node.ctype == NODE_TYPE_DOCUMENT
        assert node.is_document is True

    def test_folder_or_document(self):
        """
        document/folder instance can be quickly retrieved via `BaseTreeNode`
        instance without knowing in advance if it is folder or document
        """
        doc1 = Document.objects.create_document(
            title="three-pages.pdf",
            lang="deu",
            user_id=self.user.pk,
            parent=self.user.home_folder,
        )
        f2 = Folder.objects.create(
            title="My Documents", user=self.user, parent=self.user.inbox_folder
        )

        node1 = BaseTreeNode.objects.get(pk=doc1.pk)
        node2 = BaseTreeNode.objects.get(pk=f2.pk)

        # if node is a document - returns associated document instance
        assert node1.folder_or_document == doc1
        # if node is a folder - returns associated folder instance
        assert node2.folder_or_document == f2

    def test_document_or_folder(self):
        """
        document/folder instance can be quickly retrieved via `BaseTreeNode`
        instance without knowing in advance if it is folder or document
        """
        doc1 = Document.objects.create_document(
            title="three-pages.pdf",
            lang="deu",
            user_id=self.user.pk,
            parent=self.user.home_folder,
        )
        f2 = Folder.objects.create(
            title="My Documents", user=self.user, parent=self.user.inbox_folder
        )

        node1 = BaseTreeNode.objects.get(pk=doc1.pk)
        node2 = BaseTreeNode.objects.get(pk=f2.pk)

        # if node is a document - returns associated document instance
        assert node1.document_or_folder == doc1
        # if node is a folder - returns associated folder instance
        assert node2.document_or_folder == f2


@pytest.mark.django_db
def test_get_ancestors():
    user = user_recipe.make()
    my_docs = folder_recipe.make(user=user, parent=user.inbox_folder)

    sub1 = folder_recipe.make(user=user, parent=my_docs)

    sub2 = folder_recipe.make(user=user, parent=sub1)

    folder_recipe.make(user=user, parent=sub2)

    descendants = sub2.get_ancestors(include_self=False)
    assert len(descendants) == 3

    descendants = sub2.get_ancestors(include_self=True)
    assert len(descendants) == 4


@pytest.mark.django_db
def test_get_ancestors_returns_correct_order():
    """
    `node.get_ancestors` function is used for building node's breadcrumb.
    This is why correct order of returned ancestors is important!

    This scenario build following folder structure:

        .home > folder1 > folder2 > folder3

    i.e. folder1 is inside folder .home, folder2 is inside folder1,
    folder3 is inside folder2.

    method folder.get_ancestors is expected to return a list of node
    in following order [.home, folder1, folder2, folder3] i.e.
    .home folder is first one in the list and the node itself is
    last one in the list.
    """
    user = user_recipe.make()
    folder1 = folder_recipe.make(title="folder1", user=user, parent=user.home_folder)
    folder2 = folder_recipe.make(title="folder2", parent=folder1, user=user)
    folder3 = folder_recipe.make(title="folder3", parent=folder2, user=user)

    actual_titles = list(item.title for item in folder3.get_ancestors())
    # *Order* of list items is important here:
    # .home folder is first and the node whose ancestors are returned
    # has last position
    expected_titles = [Folder.HOME_TITLE, folder1.title, folder2.title, folder3.title]
    # lists are compared here (as order is important) - not sets!
    assert actual_titles == expected_titles


@pytest.mark.django_db
def test_get_ancestors_returns_correct_order_dont_include_self():
    """
    This scenario build following folder structure:

        .home > folder1 > folder2 > folder3

    i.e. folder1 is inside folder .home, folder2 is inside folder1,
    folder3 is inside folder2.

    method folder.get_ancestors(include_self=False) is expected to return a
    list of node in following order [.home, folder1, folder2] i.e.
    .home folder is first one in the list and node folder3 IS NOT included
    in the result list.
    """
    user = user_recipe.make()
    folder1 = folder_recipe.make(title="folder1", user=user, parent=user.home_folder)
    folder2 = folder_recipe.make(title="folder2", parent=folder1, user=user)
    folder3 = folder_recipe.make(title="folder3", parent=folder2, user=user)

    actual_titles = list(
        item.title for item in folder3.get_ancestors(include_self=False)
    )
    expected_titles = [Folder.HOME_TITLE, folder1.title, folder2.title]
    assert actual_titles == expected_titles


@pytest.mark.django_db
def test_get_by_breadcrumb_with_duplicate_paths(user: User):
    """
    Given following folders:

    - '.home/A/B/C'
    - '.inbox/A/B/C'

    node.objects.get_by_breadcrumb('.home/A/B') should
    return instance of folder B which is under .home, not the
    one under .inbox.
    """
    make_folders(".home/A/B/C", user=user)
    make_folders(".inbox/A/B/C", user=user)

    folder = Folder.objects.get_by_breadcrumb(".home/A/B", user)

    actual_breadcrumb = "/".join([title for uuid, title in folder.breadcrumb])

    assert ".home/A/B/" == actual_breadcrumb + "/"
    assert "B" == folder.title


@pytest.mark.django_db
def test_get_by_breadcrumb_with_same_of_under_multiple_users():
    """
    In this scenario there are two users
    with same folder path:
    user_A:
        .home/X/Y/Z
    user_B
        .home/X/Y/Z
    """
    user_A = user_recipe.make(username="user_A")
    user_B = user_recipe.make(username="user_B")
    make_folders(".home/X/Y/Z", user=user_A)
    make_folders(".home/X/Y/Z", user=user_B)

    # find folder under user B
    user_B_folder = Folder.objects.get_by_breadcrumb(".home/X/Y", user=user_B)

    actual_breadcrumb_b = (
        "/".join([title for uuid, title in user_B_folder.breadcrumb]) + "/"
    )

    assert ".home/X/Y/" == actual_breadcrumb_b
    assert user_B == user_B_folder.user

    # find folder under user A
    user_A_folder = Folder.objects.get_by_breadcrumb(".home/X/Y", user=user_A)

    actual_breadcrumb_a = (
        "/".join([title for uuid, title in user_B_folder.breadcrumb]) + "/"
    )
    assert ".home/X/Y/" == actual_breadcrumb_a
    assert user_A == user_A_folder.user


@pytest.mark.django_db
def test_get_by_breadcrumb_basic(user: User):
    """Test ``node.get_by_breadcrumb`` method"""
    make_folders(".home/My Documents/X/Y/Z", user)
    home = Folder.objects.get(pk=user.home_folder.pk)

    my_documents = Folder.objects.get(title="My Documents", user=user)

    # get_by_breadcrumb method should correctly return 'My Documents' folder
    my_docs = Folder.objects.get_by_breadcrumb(".home/My Documents/", user)

    expected_result = [
        (home.pk, home.title),
        (my_documents.pk, my_documents.title),
    ]

    # my_docs is indeed '.home/My documents'
    assert expected_result == my_docs.breadcrumb
    assert "My Documents" == my_docs.title


@pytest.mark.django_db
def test_get_by_breadcrumb_non_existing_path():
    user = user_recipe.make()
    with pytest.raises(Folder.DoesNotExist):
        Folder.objects.get_by_breadcrumb(".home/My Documents/", user)


@pytest.mark.django_db
def test_delete_nodes_recursively_via_basetreenode(user: User):
    """
    Given following folder hierarchy:

    .home > momo > sub-momo

    If folder "momo" is deleted via BaseTreeNode, then its subfolder
    "sub-momo" should be deleted as well
    """
    user = user_recipe.make()
    momo = folder_recipe.make(title="momo", user=user, parent=user.home_folder)

    folder_recipe.make(title="sub-momo", user=user, parent=momo)

    # delete folders via BaseTreeNode
    node = BaseTreeNode.objects.get(title="momo")
    node.delete()

    sub_momo_qs = BaseTreeNode.objects.filter(title="sub-momo")
    assert sub_momo_qs.count() == 0


@pytest.mark.django_db
def test_delete_nodes_recursively_via_folder(user: User):
    """
    Given following folder hierarchy:

    .home > momo > sub-momo

    If folder "momo" is deleted via Folder model, then its subfolder
    "sub-momo" should be deleted as well
    """
    user = user_recipe.make()
    momo = folder_recipe.make(title="momo", user=user, parent=user.home_folder)

    folder_recipe.make(title="sub-momo", user=user, parent=momo)

    # delete folders via Folder model
    folder = Folder.objects.get(title="momo")
    folder.delete()

    sub_momo_qs = BaseTreeNode.objects.filter(title="sub-momo")
    assert sub_momo_qs.count() == 0
