from django.test import TestCase

from papermerge.core.models import Document, User
from papermerge.core.serializers import NodesDownloadSerializer
from papermerge.core.nodes_download_file import NodesDownloadFile


class TestNodesDownloadFile(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="user1")

    def test_basic_nodes_download_file(self):

        doc = Document.objects.create_document(
            title="invoice.pdf",
            lang="deu",
            user_id=self.user.pk,
            parent=self.user.home_folder
        )

        serializer = NodesDownloadSerializer(
            data={
                'node_ids': [doc.id],
                'file_name': 'invoice.pdf'
            }
        )
        if serializer.is_valid():
            download = NodesDownloadFile(
                node_ids=serializer.data['node_ids'],
                file_name=serializer.data['file_name'],
            )
            self.assertEqual(download.file_name, 'invoice.pdf')
            self.assertTrue(download.wants_only_one_version())
            self.assertTrue(download.is_single_document_node())
        else:
            # should never reach this place as serialized data is
            # expected to be valid
            self.assertTrue(False)
