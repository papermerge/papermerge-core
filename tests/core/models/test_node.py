import pytest

from papermerge.test import TestCase
from papermerge.test.baker_recipes import (
    folder_recipe,
    user_recipe
)
from papermerge.core.models import User, Folder, BaseTreeNode, Document
from papermerge.core.models.node import NODE_TYPE_FOLDER, NODE_TYPE_DOCUMENT


class TestNodeModel(TestCase):

    def setUp(self):
        self.user = User.objects.create_user(username="user1")

    def test_get_tags_via_node(self):
        """
        Tags added via Folder instance may be retrieved via corresponding
        Node instance (BaseTreeNode).
        """
        folder = Folder.objects.create(
            title='My Documents',
            user=self.user,
            parent=self.user.inbox_folder
        )

        folder.tags.set(  # set tags via Folder instance
            ['folder_a', 'folder_b'],
            tag_kwargs={"user": self.user}
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
            title='My Documents',
            user=self.user,
            parent=self.user.inbox_folder
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
            parent=self.user.home_folder
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
            parent=self.user.home_folder
        )
        f2 = Folder.objects.create(
            title='My Documents',
            user=self.user,
            parent=self.user.inbox_folder
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
            parent=self.user.home_folder
        )
        f2 = Folder.objects.create(
            title='My Documents',
            user=self.user,
            parent=self.user.inbox_folder
        )

        node1 = BaseTreeNode.objects.get(pk=doc1.pk)
        node2 = BaseTreeNode.objects.get(pk=f2.pk)

        # if node is a document - returns associated document instance
        assert node1.document_or_folder == doc1
        # if node is a folder - returns associated folder instance
        assert node2.document_or_folder == f2


@pytest.mark.django_db
def test_get_descendants():
    user = user_recipe.make()
    my_docs = folder_recipe.make(
        user=user,
        parent=user.inbox_folder
    )

    sub1 = folder_recipe.make(
        user=user,
        parent=my_docs
    )

    sub2 = folder_recipe.make(
        user=user,
        parent=sub1
    )

    folder_recipe.make(
        user=user,
        parent=sub2
    )

    descendants = my_docs.get_descendants(include_self=False)
    assert len(descendants) == 3

    descendants = my_docs.get_descendants(include_self=True)
    assert len(descendants) == 4


@pytest.mark.django_db
def test_get_ancestors():
    user = user_recipe.make()
    my_docs = folder_recipe.make(
        user=user,
        parent=user.inbox_folder
    )

    sub1 = folder_recipe.make(
        user=user,
        parent=my_docs
    )

    sub2 = folder_recipe.make(
        user=user,
        parent=sub1
    )

    folder_recipe.make(
        user=user,
        parent=sub2
    )

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
    folder1 = folder_recipe.make(
        title='folder1',
        user=user,
        parent=user.home_folder
    )
    folder2 = folder_recipe.make(title='folder2', parent=folder1, user=user)
    folder3 = folder_recipe.make(title='folder3', parent=folder2, user=user)

    actual_titles = list(item.title for item in folder3.get_ancestors())
    # *Order* of list items is important here:
    # .home folder is first and the node whose ancestors are returned
    # has last position
    expected_titles = [
        Folder.HOME_TITLE, folder1.title, folder2.title, folder3.title
    ]
    # lists are compared here (as order is important) - not sets!
    assert actual_titles == expected_titles
