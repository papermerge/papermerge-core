import io

from papermerge.test import TestCase
from papermerge.core.models import (User, Document)


class TestDocumentVersionModel(TestCase):

    def setUp(self):
        self.user = User.objects.create_user(username="user1")
        self.doc = Document.objects.create_document(
            title="invoice.pdf",
            lang="deu",
            user_id=self.user.pk,
            parent=self.user.home_folder
        )
        self.doc_version = self.doc.versions.last()

    def test_update_text_field_empty_strings(self):
        """
        When ``update_text_field`` receives empty streams
        ``has_combined_text`` returns ``False``.

        Number of streams corresponds with number of pages.
        """
        self.doc_version.create_pages(page_count=3)

        self.doc_version.update_text_field([
            io.StringIO(''),
            io.StringIO(''),
            io.StringIO('')
        ])
        self.assertFalse(
            self.doc_version.has_combined_text
        )

    def test_update_text_field_non_empty_strings(self):
        """
        When ``update_text_field`` receives non empty streams
        ``has_combined_text`` returns ``True``.

        Number of streams corresponds with number of pages.
        """
        self.doc_version.create_pages(page_count=3)

        self.doc_version.update_text_field([
            io.StringIO('Non empty page 1 text'),
            io.StringIO('Non empty page 2 text'),
            io.StringIO('Non empty page 3 text')
        ])
        self.assertTrue(
            self.doc_version.has_combined_text
        )

    def test_update_text_field_streams_array_items(self):
        """
        ``update_text_field`` can receive as input:

            1. an empty list or
            2. a list with less elements than page count
            3. a list with more elements than page count
        """
        self.doc_version.create_pages(page_count=3)

        # empty streams list
        self.doc_version.update_text_field([])
        self.assertFalse(
            self.doc_version.has_combined_text
        )

        # less streams than page count ( streams = 1 < page count = 3)
        self.doc_version.update_text_field([
            io.StringIO('')
        ])
        self.assertFalse(
            self.doc_version.has_combined_text
        )

        # more streams than page count ( streams = 5 > page count = 3)
        self.doc_version.update_text_field([
            io.StringIO(''),
            io.StringIO(''),
            io.StringIO(''),
            io.StringIO(''),
            io.StringIO('')
        ])
        self.assertFalse(
            self.doc_version.has_combined_text
        )

    def test_update_text_field_one_non_empty_stream(self):
        """
        ``update_text_field`` receives one non empty stream
        (while page count is 3) - in such case ``has_combined_text``
        returns ``True``.
        """
        self.doc_version.create_pages(page_count=3)

        # streams list
        self.doc_version.update_text_field([io.StringIO('Hello OCR')])
        self.assertTrue(
            self.doc_version.has_combined_text
        )

    def test_update_text_field_correct_order(self):
        self.doc_version.create_pages(page_count=3)

        streams = [
            io.StringIO(f' OCRed text from page {page.number}  ')
            for page in self.doc_version.pages.order_by('number')
        ]

        self.doc_version.update_text_field(streams)

        ordered_pages = self.doc_version.pages.order_by('number')
        page_1 = ordered_pages[0]
        page_2 = ordered_pages[1]
        page_3 = ordered_pages[2]

        self.assertEqual(page_1.stripped_text, 'OCRed text from page 1')
        self.assertEqual(page_2.stripped_text, 'OCRed text from page 2')
        self.assertEqual(page_3.stripped_text, 'OCRed text from page 3')

    def test_update_text_field_concatinates_pages_text(self):
        """
        document_version.text = page_1.text + page_2.text + page_3.text
        """
        self.doc_version.create_pages(page_count=3)

        streams = [
            io.StringIO(f'Page {page.number}')
            for page in self.doc_version.pages.order_by('number')
        ]

        self.doc_version.update_text_field(streams)

        self.assertEqual(
            self.doc_version.text,
            'Page 1 Page 2 Page 3'
        )

    def test_document_version_is_archived(self):
        """
        Document version is considered archived if it is NOT last version
        of the document.
        Assert that last document version is indeed not archived, but
        it becomes archived as soon as document version is bumped (incremented).
        """
        doc_version = self.doc.versions.last()
        self.assertFalse(doc_version.is_archived)

        # creates a new document version
        self.doc.version_bump()
        # at this point, document version pointed by variable `doc_version`
        # is not last version anymore, thus it is considered archived
        self.assertTrue(doc_version.is_archived)
