from papermerge.test import TestCase
from papermerge.core.models import (User, Document)


class TestDocumentModel(TestCase):

    def setUp(self):
        self.user = User.objects.create_user(username="user1")

    def test_basic_document_creation(self):
        """
        Asserts very basic `Document.objects.create_document method`
        """
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
        # document's version numbering starts with 1
        self.assertEqual(document_version.number, 1)

    def test_version_bump(self):
        """
        doc.version_bump provides an easy way to increment document version.
        """
        doc = Document.objects.create_document(
            title="invoice.pdf",
            lang="deu",
            user_id=self.user.pk,
            parent=self.user.home_folder
        )
        self.assertEqual(doc.versions.count(), 1)
        last_version = doc.versions.last()
        self.assertEqual(
            last_version.number,
            1  # versioning starts with 1
        )
        # Initial document version is created with zero pages
        # i.e. without page models associated.
        # Create 3 pages (with page models)
        last_version.create_pages(page_count=3)

        doc.version_bump()
        # was document version incremented indeed?
        self.assertEqual(doc.versions.count(), 2)

        last_doc_version = doc.versions.last()
        self.assertEqual(
            last_doc_version.number,
            2
        )
        # check that associated page models were created as well
        self.assertEqual(
            last_doc_version.pages.count(),
            3
        )

    def test_idified_title_one_dot_in_title(self):
        doc = Document.objects.create_document(
            title="invoice.pdf",
            lang="deu",
            user_id=self.user.pk,
            parent=self.user.home_folder
        )

        self.assertEqual(
            f'invoice-{doc.id}.pdf',
            doc.idified_title
        )

    def test_idified_title_multiple_dots_in_title(self):
        doc = Document.objects.create_document(
            title="in.voi.ce.pdf",
            lang="deu",
            user_id=self.user.pk,
            parent=self.user.home_folder
        )

        self.assertEqual(
            f'in.voi.ce-{doc.id}.pdf',
            doc.idified_title
        )
