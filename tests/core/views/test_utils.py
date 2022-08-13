import itertools
import pytest

from model_bakery import baker

from papermerge.test import TestCase
from papermerge.test import maker
from papermerge.test.utils import pdf_content

from papermerge.core.views.utils import (
    total_merge,
    partial_merge,
    insert_pdf_pages,
    remove_pdf_pages,
    collect_text_streams,
    reuse_text_field,
    reuse_ocr_data,
    reuse_text_field_multi,
    PageRecycleMap
)
from papermerge.core.models import Document
from papermerge.core.storage import abs_path


class TestPageRecycleMap(TestCase):

    def test_page_recycle_map_1(self):
        page_map = PageRecycleMap(total=6, deleted=[1, 2])

        result = [(item.new_number, item.old_number) for item in page_map]

        assert result == [(1, 3), (2, 4), (3, 5), (4, 6)]

    def test_page_recycle_map_2(self):
        page_map = PageRecycleMap(
            total=5, deleted=[1, 5]
        )
        result = [(item.new_number, item.old_number) for item in page_map]

        assert result == [(1, 2), (2, 3), (3, 4)]

    def test_page_recycle_map_3(self):
        page_map = PageRecycleMap(
            total=5, deleted=[1]
        )
        result = [(item.new_number, item.old_number) for item in page_map]

        assert result == [(1, 2), (2, 3), (3, 4), (4, 5)]

    def test_page_recycle_map_junk_arguments(self):
        """
        `deleted_pages` argument is expected to be a list.
        In case it is not a list, ValueError exception
        will be raised.
        """
        with pytest.raises(ValueError):
            PageRecycleMap(
                total=5, deleted=1
            )

    def test_page_recycle_map_during_document_merge(self):
        """
        Input used during two documents merge
        """
        page_map = PageRecycleMap(
            total=5, deleted=[]
        )
        result = [(item.new_number, item.old_number) for item in page_map]
        assert result == [(1, 1), (2, 2), (3, 3), (4, 4), (5, 5)]

    def test_different_input_for_second_argument(self):
        page_map = PageRecycleMap(
            total=5,
            deleted=[item for item in (1, 2, 3)]
        )
        item = next(page_map)
        assert item.new_number == 1
        assert item.old_number == 4

    def test_multiple_iterations_over_same_map(self):
        page_map = list(
            PageRecycleMap(
                total=5,
                deleted=[item for item in (1, 2, 3)]
            )
        )
        list_1 = [item.old_number for item in page_map]
        list_2 = [item.old_number for item in page_map]

        assert list_1 == list_2


class TestCollectTextStreams(TestCase):
    """Tests collect_text_streams"""

    def test_collect_text_streams_basic_1(self):
        pages = baker.prepare(
            "core.Page",
            _quantity=3,
            number=itertools.cycle([1, 2, 3]),
            text=itertools.cycle(["Page 1", "Page 2", "Page 3"])
        )
        doc_version = baker.make(
            "core.DocumentVersion",
            pages=pages
        )

        actual = [
            stream.read()
            for stream in collect_text_streams(
                version=doc_version,
                page_numbers=[2, 3]
            )
        ]

        expected = ["Page 2", "Page 3"]

        assert expected == actual

    def test_collect_text_streams_basic_2(self):
        pages = baker.prepare(
            "core.Page",
            _quantity=2,
            number=itertools.cycle([1, 2]),
            text=itertools.cycle(["Page 1", "Page 2"])
        )
        doc_version = baker.make(
            "core.DocumentVersion",
            pages=pages
        )

        actual = [
            stream.read()
            for stream in collect_text_streams(
                version=doc_version,
                page_numbers=[1, 2]
            )
        ]

        expected = ["Page 1", "Page 2"]

        assert expected == actual


class TestReuseOCRdata(TestCase):
    """Tests for reuse_ocr_data"""

    def test_reuse_ocr_data_1(self):
        src_document = maker.document(
            "s3.pdf",
            user=self.user,
            include_ocr_data=True
        )
        source = src_document.versions.last()
        destination = src_document.version_bump(page_count=3)

        reuse_ocr_data(
            old_version=source,
            new_version=destination,
            page_map=PageRecycleMap(total=3)
        )

        for index in range(3):
            dst = destination.pages.all()[index]
            src = source.pages.all()[index]
            src_txt = self._get_content(src.page_path.txt_url)
            src_hocr = self._get_content(src.page_path.hocr_url)
            src_svg = self._get_content(src.page_path.svg_url)
            src_jpg = self._get_content(src.page_path.jpg_url)
            dst_txt = self._get_content(dst.page_path.txt_url)
            dst_hocr = self._get_content(dst.page_path.hocr_url)
            dst_svg = self._get_content(dst.page_path.svg_url)
            dst_jpg = self._get_content(dst.page_path.jpg_url)

            assert dst_txt == src_txt
            assert dst_hocr == src_hocr
            assert dst_svg == src_svg
            assert dst_jpg == src_jpg

    def test_reuse_ocr_data_2(self):
        src_document = maker.document(
            "s3.pdf",
            user=self.user,
            include_ocr_data=True
        )
        source = src_document.versions.last()
        destination = src_document.version_bump(page_count=1)

        reuse_ocr_data(
            old_version=source,
            new_version=destination,
            page_map=PageRecycleMap(total=3, deleted=[1, 2])
        )

        dst = destination.pages.all()[0]
        src = source.pages.all()[2]
        src_txt = self._get_content(src.page_path.txt_url)
        src_hocr = self._get_content(src.page_path.hocr_url)
        src_svg = self._get_content(src.page_path.svg_url)
        src_jpg = self._get_content(src.page_path.jpg_url)
        dst_txt = self._get_content(dst.page_path.txt_url)
        dst_hocr = self._get_content(dst.page_path.hocr_url)
        dst_svg = self._get_content(dst.page_path.svg_url)
        dst_jpg = self._get_content(dst.page_path.jpg_url)

        assert dst_txt == src_txt
        assert dst_hocr == src_hocr
        assert dst_svg == src_svg
        assert dst_jpg == src_jpg

    def _get_content(self, relative_url: str):
        file_abs_path = abs_path(relative_url)
        with open(file_abs_path, "r") as f:
            data = f.read()

        return data


class TestCopyPagesDataMulti(TestCase):
    """Tests for copy_pages_data_multi"""

    def test_copy_pages_data_multi_basic(self):
        pass


class TestReuseTextFieldMulti(TestCase):
    """Tests for reuse_text_field_multi"""

    def test_reuse_text_field_multi_1(self):
        """
        Use case: user merges one page with content "old src page 2"
        into destination document version.
        The result is expected to be one document version
        with one single page.
        """
        src_old_version = maker.document_version(
            page_count=3,
            pages_text=[
                "old src page 1",
                "old src page 2",
                "old src page 3",
            ]
        )
        dst_new_version = maker.document_version(page_count=1)

        #  this is what is tested
        reuse_text_field_multi(
            src_old_version=src_old_version,
            dst_old_version=None,
            dst_new_version=dst_new_version,
            page_numbers=[2]
        )

        actual = [page.text for page in dst_new_version.pages.all()]
        expected = [
            "old src page 2"
        ]

        assert expected == actual

    def test_reuse_text_field_multi_2(self):
        """
        Use case: user merges two pages with content "old src page 1"
        and "old src page 3" into destination document version.
        The result is expected to be a document version
        with two pages.
        """
        src_old_version = maker.document_version(
            page_count=3,
            pages_text=[
                "old src page 1",
                "old src page 2",
                "old src page 3",
            ]
        )
        dst_new_version = maker.document_version(page_count=2)

        #  this is what is tested
        reuse_text_field_multi(
            src_old_version=src_old_version,
            dst_old_version=None,
            dst_new_version=dst_new_version,
            page_numbers=[1, 3]
        )

        actual = [page.text for page in dst_new_version.pages.all()]
        expected = [
            "old src page 1",
            "old src page 3",
        ]

        assert expected == actual

    def test_reuse_text_field_multi_3(self):
        src_1_version = maker.document_version(
            page_count=3,
            pages_text=[
                "src 1 page 1",
                "src 1 page 2",
                "src 1 page 3",
            ]
        )
        src_2_version = maker.document_version(
            page_count=3,
            pages_text=[
                "src 2 page 1",
                "src 2 page 2",
                "src 2 page 3",
            ]
        )
        dst_version = maker.document_version(page_count=4)

        #  this is what is tested
        reuse_text_field_multi(
            src_old_version=src_1_version,
            dst_old_version=src_2_version,
            dst_new_version=dst_version,
            page_numbers=[1],
            position=0
        )

        actual = [page.text for page in dst_version.pages.all()]
        expected = [
            "src 1 page 1",
            "src 2 page 1",
            "src 2 page 2",
            "src 2 page 3",
        ]

        assert expected == actual

    def test_reuse_text_field_multi_4(self):
        src_1_version = maker.document_version(
            page_count=3,
            pages_text=[
                "src 1 page 1",
                "src 1 page 2",
                "src 1 page 3",
            ]
        )
        src_2_version = maker.document_version(
            page_count=3,
            pages_text=[
                "src 2 page 1",
                "src 2 page 2",
                "src 2 page 3",
            ]
        )
        dst_version = maker.document_version(page_count=4)

        #  this is what is tested
        reuse_text_field_multi(
            src_old_version=src_1_version,
            dst_old_version=src_2_version,
            dst_new_version=dst_version,
            page_numbers=[1],
            position=1
        )

        actual = [page.text for page in dst_version.pages.all()]
        expected = [
            "src 2 page 1",
            "src 1 page 1",
            "src 2 page 2",
            "src 2 page 3",
        ]

        assert expected == actual

    def test_reuse_text_field_multi_5(self):
        src_1_version = maker.document_version(
            page_count=3,
            pages_text=[
                "src 1 page 1",
                "src 1 page 2",
                "src 1 page 3",
            ]
        )
        src_2_version = maker.document_version(
            page_count=3,
            pages_text=[
                "src 2 page 1",
                "src 2 page 2",
                "src 2 page 3",
            ]
        )
        dst_version = maker.document_version(page_count=5)

        #  this is what is tested
        reuse_text_field_multi(
            src_old_version=src_1_version,
            dst_old_version=src_2_version,
            dst_new_version=dst_version,
            page_numbers=[2, 3],
            position=1  # position index starts with 0
        )

        actual = [page.text for page in dst_version.pages.all()]
        expected = [
            "src 2 page 1",
            "src 1 page 2",
            "src 1 page 3",
            "src 2 page 2",
            "src 2 page 3",
        ]

        assert expected == actual

    def test_reuse_text_field_multi_6(self):
        """
        Merge two pages at the end of destination document version
        """
        src_1_version = maker.document_version(
            page_count=3,
            pages_text=[
                "src 1 page 1",
                "src 1 page 2",
                "src 1 page 3",
            ]
        )
        src_2_version = maker.document_version(
            page_count=3,
            pages_text=[
                "src 2 page 1",
                "src 2 page 2",
                "src 2 page 3",
            ]
        )
        dst_version = maker.document_version(page_count=5)

        #  this is what is tested
        # merging at the end of destination document version
        reuse_text_field_multi(
            src_old_version=src_1_version,
            dst_old_version=src_2_version,
            dst_new_version=dst_version,
            page_numbers=[2, 3],
            # position index starts with 0
            # because dst_old_version has 3 pages, position=3 means
            # merging at the end of document version
            position=3  # position index starts with 0
        )

        actual = [page.text for page in dst_version.pages.all()]
        expected = [
            "src 2 page 1",
            "src 2 page 2",
            "src 2 page 3",
            # merging at the end
            "src 1 page 2",  # copied page number 2
            "src 1 page 3",  # copied page number 3
        ]

        assert expected == actual


class TestReuseTextField(TestCase):
    """Tests for reuse_text_field"""

    def test_reuse_text_field_basic(self):
        """
        Old document version has three pages with following text:
         # page number => content
         ------------------------
         1 => I am content from Page 1
         2 => I am content from Page 2
         3 => And I am content from Page 3

         User removes first document version page.
         This means that newly created document version will contain
         in `text` following:

         # page number => content
         -------------------------
         1 => I am content from Page 2
         2 => And I am content from Page 3
        """
        pages_old = baker.prepare(
            "core.Page",
            _quantity=3,
            number=itertools.cycle([1, 2, 3]),
            text=itertools.cycle([
                "I am content from Page 1",
                "I am content from Page 2",
                "And I am content from Page 3"
            ])
        )
        doc_version_old = baker.make(
            "core.DocumentVersion",
            pages=pages_old
        )
        # User deletes one page, which means
        # new document version will have 2 pages
        pages_new = baker.prepare("core.Page", _quantity=2)
        doc_version_new = baker.make("core.DocumentVersion", pages=pages_new)

        #  this is what is tested
        reuse_text_field(
            old_version=doc_version_old,
            new_version=doc_version_new,
            # TODO: replace list with PageRecycleMap
            page_map=[(1, 2), (2, 3)]
        )

        actual = [page.text for page in doc_version_new.pages.all()]
        expected = [
            "I am content from Page 2",
            "And I am content from Page 3"
        ]

        assert expected == actual


class TestRemovePdfPages(TestCase):
    """Tests for remove_pdf_pages"""
    def test_remove_pdf_pages_basic_1(self):
        """Remove one page from the document version"""
        src_document = maker.document(
            "s3.pdf",
            user=self.user
        )
        src_old_version = src_document.versions.last()
        src_new_version = src_document.version_bump(page_count=2)

        remove_pdf_pages(
            old_version=src_old_version,
            new_version=src_new_version,
            page_numbers=[1]
        )

        content = pdf_content(src_new_version, clean=True)
        assert content == "S2 S3"

    def test_remove_pdf_pages_basic_2(self):
        """Remove last two pages from the document version"""
        src_document = maker.document(
            "s3.pdf",
            user=self.user
        )
        src_old_version = src_document.versions.last()
        src_new_version = src_document.version_bump(page_count=2)

        remove_pdf_pages(
            old_version=src_old_version,
            new_version=src_new_version,
            page_numbers=[2, 3]
        )

        content = pdf_content(src_new_version, clean=True)
        assert content == "S1"

    def test_remove_pdf_pages_invalid_input(self):
        """Junk page_numbers input"""
        src_document = maker.document(
            "s3.pdf",
            user=self.user
        )
        src_old_version = src_document.versions.last()
        src_new_version = src_document.version_bump(page_count=2)

        with pytest.raises(ValueError):
            remove_pdf_pages(
                old_version=src_old_version,
                new_version=src_new_version,
                page_numbers=[]  # invalid, empty list
            )

        with pytest.raises(ValueError):
            remove_pdf_pages(
                old_version=src_old_version,
                new_version=src_new_version,
                page_numbers=[1, 2, 3, 4, 5, 6, 7]  # invalid, too many values
            )


class TestInserPdfPagesUtilityFunction(TestCase):
    """Tests for insert_pdf_pages"""

    def test_insert_pdf_pages_basic_1(self):
        """
        We test moving of one page from source document version to
        destination document version.

        Initial state:
            source has three pages: S1, S2, S3 and
            destination has three pages: D1, D2, D3
        After we insert page S1 to destination at position 0 following
        state is expected:
            destination (latest version): S1, D1, D2, D3
        """
        src_document = maker.document(
            "s3.pdf",
            user=self.user
        )
        src_old_version = src_document.versions.last()
        dst_document = maker.document(
            "d3.pdf",
            user=self.user
        )
        dst_new_version = dst_document.version_bump(page_count=4)
        dst_old_version = dst_document.versions.first()

        insert_pdf_pages(
            src_old_version=src_old_version,
            dst_old_version=dst_old_version,
            dst_new_version=dst_new_version,
            src_page_numbers=[1],  # i.e. first page
            dst_position=0
        )

        dst_new_content = pdf_content(dst_new_version, clean=True)
        assert "S1 D1 D2 D3" == dst_new_content

    def test_insert_pdf_pages_basic_2(self):
        """
        We test moving of two pages from source document version to
        destination document version.

        Initial state:
            source has three pages: S1, S2, S3 and
            destination has three pages as well: D1, D2, D3
        After we insert page S1 and S3 to destination at position 1 following
        state is expected:
            destination (latest version): D1, S1, S3, D2, D3
        """
        src_document = maker.document(
            "s3.pdf",
            user=self.user
        )
        src_old_version = src_document.versions.last()
        dst_document = maker.document(
            "d3.pdf",
            user=self.user
        )
        dst_new_version = dst_document.version_bump(page_count=5)
        dst_old_version = dst_document.versions.first()

        insert_pdf_pages(
            src_old_version=src_old_version,
            dst_old_version=dst_old_version,
            dst_new_version=dst_new_version,
            src_page_numbers=[1, 3],
            dst_position=1
        )

        dst_new_content = pdf_content(dst_new_version, clean=True)
        assert "D1 S1 S3 D2 D3" == dst_new_content

    def test_insert_pdf_pages_when_dst_old_is_None(self):
        """
        We test moving of two pages from source document version to
        destination document version with dst_old_version=None.
        Notice that in this case dst_position argument will be discarded
        i.e. whatever value you pass, it is always considered as 0.

        Initial state:
            source has three pages: S1, S2, S3 and
            destination has three pages as well: D1, D2, D3
        After we insert page S1 and S3 to destination, and we provide
         dst_old_version=None. Following state is expected:
            destination (latest version): S1, S3
        """
        src_document = maker.document(
            "s3.pdf",
            user=self.user
        )
        src_old_version = src_document.versions.last()
        dst_document = maker.document(
            "d3.pdf",
            user=self.user
        )
        dst_new_version = dst_document.version_bump(page_count=2)

        insert_pdf_pages(
            src_old_version=src_old_version,
            dst_old_version=None,
            dst_new_version=dst_new_version,
            src_page_numbers=[1, 3]
        )

        dst_new_content = pdf_content(dst_new_version, clean=True)
        assert "S1 S3" == dst_new_content


class TestUtils(TestCase):

    def test_total_merge_of_one_page_documents(self):
        # source document was not OCRed yet
        # source document has one page with text "Scan v2"
        src_document = maker.document(
            "one-page-scan-v2.pdf",
            user=self.user
        )
        # destination document was not OCRed yet
        # destination document has one page with text "Scan v1"
        dst_document = maker.document(
            "one-page-scan-v1.pdf",
            user=self.user,
        )
        # Version increment is performed outside total_merge
        dst_new_version = dst_document.version_bump()

        # this is what we test
        total_merge(
            src_old_version=src_document.versions.last(),
            dst_new_version=dst_new_version
        )

        # 1. src_document must be deleted by now
        with pytest.raises(Document.DoesNotExist):
            Document.objects.get(pk=src_document.pk)

        # 2. dst document's first version must contain one page
        # with "Scan v1" text
        first_version = dst_document.versions.first()
        assert first_version.pages.count() == 1
        assert "Scan v1" == pdf_content(first_version)

        second_version = dst_document.versions.last()
        # 3. dst document's last version must contain one page
        # with "Scan v2" text
        assert second_version.pages.count() == 1
        assert "Scan v2" == pdf_content(second_version)

    def test_partial_merge_scenario_1(self):
        """
        In this scenario initially there are two documents:
        source:
            page 1 with text "Document A"
            page 2 with text "Scan v2"
        destination:
            page 1 with text "Scan v1"

        Then, second page of the source is (partially) merged into
        destination. The result is expected to be as follows:
        (newly created version of) source:
            page 1 with text "Document A"
        (newly created version of) destination:
            page 1 with text "Scan v2"
        """
        # source document was not OCRed yet
        # source document has two pages with text:
        # page 1 - "Document A"
        # page 2 - "Scan v2"
        src_document = maker.document(
            "partial_merge_scenario_1_src.pdf",
            user=self.user
        )
        src_new_version = src_document.version_bump(page_count=1)
        # destination document was not OCRed yet
        # destination document has one page with text "Scan v1"
        dst_document = maker.document(
            "partial_merge_scenario_1_dst.pdf",
            user=self.user,
        )
        # Version increment is performed outside total_merge
        dst_new_version = dst_document.version_bump(page_count=1)

        # this is what we test
        partial_merge(
            src_old_version=src_document.versions.first(),
            src_new_version=src_new_version,
            dst_new_version=dst_new_version,
            page_numbers=[2]  # page numbering starts with "1"
        )

        # 1. dst document's first version must contain one page
        # with "Scan v1" text
        first_version = dst_document.versions.first()
        assert "Scan v1" == pdf_content(first_version)

        second_version = dst_document.versions.last()
        # 2. dst document's last version must contain one page
        # with "Scan v2" text
        assert "Scan v2" == pdf_content(second_version)

        # 3. newly created source version must contain only "Document A"
        assert "Document A" == pdf_content(src_new_version)
