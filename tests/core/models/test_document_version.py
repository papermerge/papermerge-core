import io

from papermerge.core.models import Document, User
from papermerge.test import maker
from papermerge.test.testcases import TestCase


class TestDocumentVersionModel(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="user1")
        self.doc = Document.objects.create_document(
            title="invoice.pdf",
            lang="deu",
            user_id=self.user.pk,
            parent=self.user.home_folder,
        )
        self.doc_version = self.doc.versions.last()

    def test_update_text_field_empty_strings(self):
        """
        When ``update_text_field`` receives empty streams
        ``has_combined_text`` returns ``False``.

        Number of streams corresponds with number of pages.
        """
        self.doc_version.create_pages(page_count=3)

        self.doc_version.update_text_field(
            [io.StringIO(""), io.StringIO(""), io.StringIO("")]
        )
        self.assertFalse(self.doc_version.has_combined_text)

    def test_update_text_field_non_empty_strings(self):
        """
        When ``update_text_field`` receives non empty streams
        ``has_combined_text`` returns ``True``.

        Number of streams corresponds with number of pages.
        """
        self.doc_version.create_pages(page_count=3)

        self.doc_version.update_text_field(
            [
                io.StringIO("Non empty page 1 text"),
                io.StringIO("Non empty page 2 text"),
                io.StringIO("Non empty page 3 text"),
            ]
        )
        self.assertTrue(self.doc_version.has_combined_text)

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
        self.assertFalse(self.doc_version.has_combined_text)

        # less streams than page count ( streams = 1 < page count = 3)
        self.doc_version.update_text_field([io.StringIO("")])
        self.assertFalse(self.doc_version.has_combined_text)

        # more streams than page count ( streams = 5 > page count = 3)
        self.doc_version.update_text_field(
            [
                io.StringIO(""),
                io.StringIO(""),
                io.StringIO(""),
                io.StringIO(""),
                io.StringIO(""),
            ]
        )
        self.assertFalse(self.doc_version.has_combined_text)

    def test_update_text_field_one_non_empty_stream(self):
        """
        ``update_text_field`` receives one non empty stream
        (while page count is 3) - in such case ``has_combined_text``
        returns ``True``.
        """
        self.doc_version.create_pages(page_count=3)

        # streams list
        self.doc_version.update_text_field([io.StringIO("Hello OCR")])
        self.assertTrue(self.doc_version.has_combined_text)

    def test_update_text_field_correct_order(self):
        self.doc_version.create_pages(page_count=3)

        streams = [
            io.StringIO(f" OCRed text from page {page.number}  ")
            for page in self.doc_version.pages.order_by("number")
        ]

        self.doc_version.update_text_field(streams)

        ordered_pages = self.doc_version.pages.order_by("number")
        page_1 = ordered_pages[0]
        page_2 = ordered_pages[1]
        page_3 = ordered_pages[2]

        self.assertEqual(page_1.stripped_text, "OCRed text from page 1")
        self.assertEqual(page_2.stripped_text, "OCRed text from page 2")
        self.assertEqual(page_3.stripped_text, "OCRed text from page 3")

    def test_update_text_field_concatinates_pages_text(self):
        """
        document_version.text = page_1.text + page_2.text + page_3.text
        """
        self.doc_version.create_pages(page_count=3)

        streams = [
            io.StringIO(f"Page {page.number}")
            for page in self.doc_version.pages.order_by("number")
        ]

        self.doc_version.update_text_field(streams)

        self.assertEqual(self.doc_version.text, "Page 1 Page 2 Page 3")

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

    def test_get_ocred_text_1_filter_by_page_numbers(self):
        doc_ver = maker.document_version(
            page_count=3,
            pages_text=[
                "Text of page 1",
                "Text of page 2",
                "Text of page 3",
            ],
        )

        actual = doc_ver.get_ocred_text(page_numbers=[1, 3])
        expected = "Text of page 1 Text of page 3"
        assert expected == actual

    def test_get_ocred_text_1_filter_by_page_ids(self):
        doc_ver = maker.document_version(
            page_count=3,
            pages_text=[
                "Text of page 1",
                "Text of page 2",
                "Text of page 3",
            ],
        )

        page_1_id = str(doc_ver.pages.all()[0].pk)
        page_2_id = str(doc_ver.pages.all()[1].pk)

        actual = doc_ver.get_ocred_text(page_ids=[page_1_id, page_2_id])
        expected = "Text of page 1 Text of page 2"
        assert expected == actual

    def test_get_ocred_text_2_no_filters(self):
        doc_ver = maker.document_version(
            page_count=3,
            pages_text=[
                "T1",
                "T2",
                "T3",
            ],
            text="T1 T2 T3",
        )

        actual = doc_ver.get_ocred_text()
        expected = "T1 T2 T3"
        assert expected == actual

    def test_get_ocred_text_mind_one_blank_page(self):
        """
        Consider the case when document has 3 pages and two of them
        contains some text, while one (the blank page) does not.
        In such case, if user requests OCRed text of the blank page only,
        then he/she will get as result - empty string.
        """
        doc_ver = maker.document_version(
            page_count=3,
            pages_text=[
                "T1",
                "",  # empty page
                "T3",
            ],
            text="T1 T3",
        )
        page_2_id = str(doc_ver.pages.all()[1].pk)

        # user requests OCRed text ONLY of the blank page
        actual = doc_ver.get_ocred_text(page_ids=[page_2_id])
        # even document has other non-blank pages, because user
        # requested specifically blank page, he/she must get empty
        # string as result
        expected = ""
        assert expected == actual
