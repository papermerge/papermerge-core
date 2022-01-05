import io

from papermerge.test import TestCase
from papermerge.core.models import (User, Document)


class TestDocumentModel(TestCase):

    def setUp(self):
        self.user = User.objects.create_user(username="user1")
        self.doc = Document.objects.create_document(
            title="invoice.pdf",
            lang="deu",
            user_id=self.user.pk,
            parent=self.user.home_folder
        )
        self.doc_version = self.doc.versions.last()

    def test_update_text_field_empty_stream(self):
        self.doc_version.create_pages(page_count=1)
        page = self.doc_version.pages.first()

        page.update_text_field(io.StringIO(''))

        self.assertFalse(page.has_text)

    def test_update_text_field_non_empty_stream(self):
        self.doc_version.create_pages(page_count=1)
        page = self.doc_version.pages.first()

        page.update_text_field(io.StringIO('Hello OCR'))

        self.assertTrue(page.has_text)

    def test_stripped_text(self):
        self.doc_version.create_pages(page_count=1)
        page = self.doc_version.pages.first()

        # notice left and right white spaces
        page.update_text_field(io.StringIO(' Hello   '))
        self.assertEqual(page.stripped_text, 'Hello')
        self.assertTrue(page.has_text)
