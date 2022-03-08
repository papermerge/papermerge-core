import os
import shutil
from pathlib import Path

from papermerge.core.storage import abs
from papermerge.test import TestCase
from papermerge.core.models import (User, Document)

MODELS_DIR_ABS_PATH = os.path.abspath(os.path.dirname(__file__))
TEST_DIR_ABS_PATH = os.path.dirname(
    os.path.dirname(MODELS_DIR_ABS_PATH)
)


class TestDocumentModel(TestCase):
    def setUp(self):
        self.resources = Path(TEST_DIR_ABS_PATH) / 'resources'
        self.user = User.objects.create_user(username="user1")
        self.media = Path(TEST_DIR_ABS_PATH) / 'media'
        shutil.rmtree(self.media / 'docs', ignore_errors=True)
        shutil.rmtree(self.media / 'sidecars', ignore_errors=True)

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

    def test_upload_payload_to_zero_sized_document(self):
        """
        Upon creation document model has associated zero sized document_version
        i.e. document_version.size == 0.

        Check that uploaded file is associated with already
        existing document version and document version is NOT
        incremented.
        """
        doc = Document.objects.create_document(
            title="three-pages.pdf",
            lang="deu",
            user_id=self.user.pk,
            parent=self.user.home_folder
        )

        payload = open(self.resources / 'three-pages.pdf', 'rb')

        last_version = doc.versions.last()
        assert doc.versions.count() == 1
        assert last_version.size == 0

        doc.upload(
            payload=payload,
            file_path=self.resources / 'three-pages.pdf',
            file_name='three-pages.pdf'
        )

        last_version = doc.versions.last()
        assert doc.versions.count() == 1
        assert last_version.size > 0

        assert os.path.exists(
            abs(last_version.document_path)
        )

        payload.close()
