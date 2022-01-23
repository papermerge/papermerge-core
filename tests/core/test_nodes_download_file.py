from django.test import TestCase

from papermerge.core.serializers import NodesDownloadSerializer
from papermerge.core.nodes_download_file import NodesDownloadFile


class TestNodesDownloadFile(TestCase):

    def test_basic_nodes_download_file(self):
        serializer = NodesDownloadSerializer(
            data={
                'nodes': [{'id': 1}],
                'file_name': 'invoice.pdf'
            }
        )
        if serializer.is_valid():
            download = NodesDownloadFile(**serializer.data)

            self.assertEqual(download.file_name, 'invoice.pdf')
            self.assertEqual(download.content_type, 'application/pdf')
            self.assertEqual(
                download.content_disposition,
                'attachment; filename=invoice.pdf'
            )
        else:
            # should never reach this place as serialized data is
            # expected to be valid
            self.assertTrue(False)

