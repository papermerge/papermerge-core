import io

from papermerge.core.models import Document, User
from papermerge.test.testcases import TestCase


class TestDocumentModel(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="user1")
        self.doc = Document.objects.create_document(
            title="invoice.pdf",
            lang="deu",
            user_id=self.user.pk,
            parent=self.user.home_folder,
        )
        self.doc_version = self.doc.versions.last()

    def test_update_text_field_empty_stream(self):
        self.doc_version.create_pages(page_count=1)
        page = self.doc_version.pages.first()

        page.update_text_field(io.StringIO(""))

        self.assertFalse(page.has_text)

    def test_update_text_field_non_empty_stream(self):
        self.doc_version.create_pages(page_count=1)
        page = self.doc_version.pages.first()

        page.update_text_field(io.StringIO("Hello OCR"))

        self.assertTrue(page.has_text)

    def test_stripped_text(self):
        self.doc_version.create_pages(page_count=1)
        page = self.doc_version.pages.first()

        # notice left and right white spaces
        page.update_text_field(io.StringIO(" Hello   "))
        self.assertEqual(page.stripped_text, "Hello")
        self.assertTrue(page.has_text)

    def test_page_is_archived(self):
        """
        Page is considered archived if it belongs to archived document
        version i.e. page belongs to non-last document version.

        Assert that page.is_archived works as expected.
        """
        doc_version = self.doc.versions.last()
        self.doc_version.create_pages(page_count=2)
        pages = doc_version.pages.all()
        # Because both pages belong to last document version
        # neither of the pages is archived
        self.assertFalse(pages[0].is_archived)
        self.assertFalse(pages[1].is_archived)

        self.doc.version_bump()

        # Because version was bumped (i.e. incremented),
        # previously non-archived pages now are archived.
        self.assertTrue(pages[0].is_archived)  # belongs to non-last doc version
        self.assertTrue(pages[1].is_archived)  # belongs to non-last doc version
