from papermerge.test import TestCase
from papermerge.core.models import (User, Document)


class TestDocumentModel(TestCase):

    def setUp(self):
        self.user = User.objects.create_user(username="user1")

    def test_basic_document_creation(self):
        doc = Document.objects.create_document(
            title="invoice.pdf",
            lang="deu",
            user_id=self.user.pk,
            parent=self.user.home_folder
        )
        self.assertTrue(doc)

        self.assertEqual(doc.versions.count(), 1)

        document_version = doc.versions.first()
        # Before any file upload, document version has
        # size = 0, page_count = 0 and Falsy file_name
        self.assertEqual(document_version.size, 0)
        self.assertEqual(document_version.page_count, 0)
        self.assertFalse(document_version.file_name)
