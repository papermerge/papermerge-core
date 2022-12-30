from papermerge.test import TestCase
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
