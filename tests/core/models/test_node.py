from papermerge.test import TestCase
from papermerge.core.models import User, Folder, BaseTreeNode


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
