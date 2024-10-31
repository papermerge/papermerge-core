import itertools
from pathlib import Path
from unittest.mock import patch

import pytest
from django.test import override_settings
from model_bakery import baker

from papermerge.core.models import Page
from papermerge.core.utils import (
    PageRecycleMap,
    collect_text_streams,
    insert_pdf_pages,
    namespaced,
    remove_pdf_pages,
    reuse_ocr_data_multi,
    reuse_text_field,
    reuse_text_field_multi,
)
from papermerge.test import maker
from papermerge.test.testcases import TestCase
from papermerge.test.utils import pdf_content


class TestUtilsNamespaced(TestCase):
    def test_namespaced_without_namespace(self):
        assert namespaced("some_text") == "some_text"
        assert namespaced("abc") == "abc"

    @override_settings(PAPERMERGE_NAMESPACE="mything")
    def test_namespaced_with_namespace(self):
        assert namespaced("some_text") == "mything__some_text"
        assert namespaced("xyz") == "mything__xyz"

    @override_settings(PAPERMERGE_NAMESPACE="your_thing")
    def test_namespaced_with_namespace_2(self):
        assert namespaced("abc") == "your_thing__abc"
        assert namespaced("star_light") == "your_thing__star_light"


class TestPageRecycleMap(TestCase):
    def test_page_recycle_map_1(self):
        page_map = PageRecycleMap(total=6, deleted=[1, 2])

        result = [(item.new_number, item.old_number) for item in page_map]

        assert result == [(1, 3), (2, 4), (3, 5), (4, 6)]

    def test_page_recycle_map_2(self):
        page_map = PageRecycleMap(total=5, deleted=[1, 5])
        result = [(item.new_number, item.old_number) for item in page_map]

        assert result == [(1, 2), (2, 3), (3, 4)]

    def test_page_recycle_map_3(self):
        page_map = PageRecycleMap(total=5, deleted=[1])
        result = [(item.new_number, item.old_number) for item in page_map]

        assert result == [(1, 2), (2, 3), (3, 4), (4, 5)]

    def test_page_recycle_map_junk_arguments(self):
        """
        `deleted_pages` argument is expected to be a list.
        In case it is not a list, ValueError exception
        will be raised.
        """
        with pytest.raises(ValueError):
            PageRecycleMap(total=5, deleted=1)

    def test_page_recycle_map_during_document_merge(self):
        """
        Input used during two documents merge
        """
        page_map = PageRecycleMap(total=5, deleted=[])
        result = [(item.new_number, item.old_number) for item in page_map]
        assert result == [(1, 1), (2, 2), (3, 3), (4, 4), (5, 5)]

    def test_different_input_for_second_argument(self):
        page_map = PageRecycleMap(total=5, deleted=[item for item in (1, 2, 3)])
        item = next(page_map)
        assert item.new_number == 1
        assert item.old_number == 4

    def test_multiple_iterations_over_same_map(self):
        page_map = list(PageRecycleMap(total=5, deleted=[item for item in (1, 2, 3)]))
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
            text=itertools.cycle(["Page 1", "Page 2", "Page 3"]),
        )
        doc_version = baker.make("core.DocumentVersion", pages=pages)

        actual = [
            stream.read()
            for stream in collect_text_streams(version=doc_version, page_numbers=[2, 3])
        ]

        expected = ["Page 2", "Page 3"]

        assert expected == actual

    def test_collect_text_streams_basic_2(self):
        pages = baker.prepare(
            "core.Page",
            _quantity=2,
            number=itertools.cycle([1, 2]),
            text=itertools.cycle(["Page 1", "Page 2"]),
        )
        doc_version = baker.make("core.DocumentVersion", pages=pages)

        actual = [
            stream.read()
            for stream in collect_text_streams(version=doc_version, page_numbers=[1, 2])
        ]

        expected = ["Page 1", "Page 2"]

        assert expected == actual


@pytest.mark.skip()
class TestReuseOCRDataMulti(TestCase):
    """Tests for reuse_ocr_data_multi"""

    def test_reuse_ocr_data_multi_1(self):
        """
        In this scenario we reuse ocr data from page 2.
        Page 2 was merged to destination (position 0):

        src 1/src old  | src 2/dst old |  dst / result
        -----------------------------------------------
               1       |     X         |      2
               2       |     X         |
               3       |     X         |
        """
        src_old_version = maker.document_version(
            page_count=3,
            pages_text=[
                "old src page 1",
                "old src page 2",
                "old src page 3",
            ],
            include_ocr_data=True,
        )
        dst_new_version = maker.document_version(page_count=1, include_ocr_data=True)

        #  this is what is tested
        reuse_ocr_data_multi(
            src_old_version=src_old_version,
            dst_old_version=None,
            dst_new_version=dst_new_version,
            page_numbers=[2],
        )

        src_page = src_old_version.pages.all()[1]  # page number 2
        dst_page = dst_new_version.pages.all()[0]

        _assert_same_ocr_data(src=src_page, dst=dst_page)

    def test_reuse_ocr_data_multi_2(self):
        """
        In this scenario we reuse ocr data from pages 1 and 3.
        Pages 1 and 3 were merged to destination (position 0):

        src 1/src old  | src 2/dst old |  dst / result
        -----------------------------------------------
               1       |     X         |      1
               2       |     X         |      3
               3       |     X         |
        """
        src_old_version = maker.document_version(
            page_count=3,
            pages_text=[
                "old src page 1",
                "old src page 2",
                "old src page 3",
            ],
            include_ocr_data=True,
        )
        dst_new_version = maker.document_version(page_count=2, include_ocr_data=True)

        #  this is what is tested
        reuse_ocr_data_multi(
            src_old_version=src_old_version,
            dst_old_version=None,
            dst_new_version=dst_new_version,
            page_numbers=[1, 3],
        )

        for src_index, dst_index in ((0, 0), (2, 1)):
            src_page = src_old_version.pages.all()[src_index]
            dst_page = dst_new_version.pages.all()[dst_index]

            _assert_same_ocr_data(src=src_page, dst=dst_page)

    def test_reuse_ocr_data_multi_3(self):
        """
        In this scenario we reuse ocr data from page 1.
        Page 1 was moved to destination's position 0:

        src 1/src old  | src 2/dst old |  dst / result
        -----------------------------------------------
               1       |      i        |      1
               2       |      ii       |      i
               3       |      iii      |      ii
                       |               |      iii
        """
        src_old_version = maker.document_version(
            page_count=3,
            pages_text=[
                "old src page 1",
                "old src page 2",
                "old src page 3",
            ],
            include_ocr_data=True,
        )
        dst_old_version = maker.document_version(
            page_count=3,
            pages_text=[
                "old dst page 1",
                "old dst page 2",
                "old dst page 3",
            ],
            include_ocr_data=True,
        )
        dst_new_version = maker.document_version(page_count=4, include_ocr_data=True)

        #  this is what is tested
        reuse_ocr_data_multi(
            src_old_version=src_old_version,
            dst_old_version=dst_old_version,
            dst_new_version=dst_new_version,
            page_numbers=[1],
            position=0,
        )

        src_1_page = src_old_version.pages.all()[0]
        dst_page = dst_new_version.pages.all()[0]

        _assert_same_ocr_data(
            src=src_1_page, dst=dst_page, message="src_1_page != dst_page"
        )

        for index in range(3):
            src_2_page = dst_old_version.pages.all()[index]
            dst_page = dst_new_version.pages.all()[index + 1]

            _assert_same_ocr_data(
                src=src_2_page,
                dst=dst_page,
                message=f"src_2_page[{index}] != dst_page[{index + 1}]",
            )

    def test_reuse_ocr_data_multi_4(self):
        """
        In this scenario we reuse ocr data from pages 1 and 2.
        Pages 1 and 2 were moved to destination to position 1:

        src 1/src old  | src 2/dst old |  dst / result
        -----------------------------------------------
               1       |      i        |      i
               2       |      ii       |      1
               3       |      iii      |      2
                       |               |      ii
                       |               |      iii
        """
        src_old_version = maker.document_version(
            page_count=3,
            pages_text=[
                "old src page 1",
                "old src page 2",
                "old src page 3",
            ],
            include_ocr_data=True,
        )
        dst_old_version = maker.document_version(
            page_count=3,
            pages_text=[
                "old dst page 1",
                "old dst page 2",
                "old dst page 3",
            ],
            include_ocr_data=True,
        )
        dst_new_version = maker.document_version(page_count=5, include_ocr_data=True)

        #  this is what is tested
        reuse_ocr_data_multi(
            src_old_version=src_old_version,
            dst_old_version=dst_old_version,
            dst_new_version=dst_new_version,
            page_numbers=[1, 2],
            position=1,
        )

        src_2_page = dst_old_version.pages.all()[0]
        dst_page = dst_new_version.pages.all()[0]

        _assert_same_ocr_data(
            src=src_2_page, dst=dst_page, message="src_2_page[0] != dst_page[0]"
        )

        src_1_page = src_old_version.pages.all()[0]  # page number 1
        dst_page = dst_new_version.pages.all()[1]

        _assert_same_ocr_data(
            src=src_1_page, dst=dst_page, message="src_1_page[0] != dst_page[1]"
        )

        src_1_page = src_old_version.pages.all()[1]  # page number 2
        dst_page = dst_new_version.pages.all()[2]

        _assert_same_ocr_data(
            src=src_1_page, dst=dst_page, message="src_1_page[1] != dst_page[2]"
        )

        src_2_page = dst_old_version.pages.all()[1]
        dst_page = dst_new_version.pages.all()[3]

        _assert_same_ocr_data(
            src=src_2_page, dst=dst_page, message="src_2_page[1] != dst_page[3]"
        )

        src_2_page = dst_old_version.pages.all()[2]
        dst_page = dst_new_version.pages.all()[4]

        _assert_same_ocr_data(
            src=src_2_page, dst=dst_page, message="src_2_page[2] != dst_page[4]"
        )


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
            ],
        )
        dst_new_version = maker.document_version(page_count=1)

        #  this is what is tested
        reuse_text_field_multi(
            src_old_version=src_old_version,
            dst_old_version=None,
            dst_new_version=dst_new_version,
            page_numbers=[2],
        )

        actual = [page.text for page in dst_new_version.pages.all()]
        expected = ["old src page 2"]

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
            ],
        )
        dst_new_version = maker.document_version(page_count=2)

        #  this is what is tested
        reuse_text_field_multi(
            src_old_version=src_old_version,
            dst_old_version=None,
            dst_new_version=dst_new_version,
            page_numbers=[1, 3],
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
            ],
        )
        src_2_version = maker.document_version(
            page_count=3,
            pages_text=[
                "src 2 page 1",
                "src 2 page 2",
                "src 2 page 3",
            ],
        )
        dst_version = maker.document_version(page_count=4)

        #  this is what is tested
        reuse_text_field_multi(
            src_old_version=src_1_version,
            dst_old_version=src_2_version,
            dst_new_version=dst_version,
            page_numbers=[1],
            position=0,
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
            ],
        )
        src_2_version = maker.document_version(
            page_count=3,
            pages_text=[
                "src 2 page 1",
                "src 2 page 2",
                "src 2 page 3",
            ],
        )
        dst_version = maker.document_version(page_count=4)

        #  this is what is tested
        reuse_text_field_multi(
            src_old_version=src_1_version,
            dst_old_version=src_2_version,
            dst_new_version=dst_version,
            page_numbers=[1],
            position=1,
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
            ],
        )
        src_2_version = maker.document_version(
            page_count=3,
            pages_text=[
                "src 2 page 1",
                "src 2 page 2",
                "src 2 page 3",
            ],
        )
        dst_version = maker.document_version(page_count=5)

        #  this is what is tested
        reuse_text_field_multi(
            src_old_version=src_1_version,
            dst_old_version=src_2_version,
            dst_new_version=dst_version,
            page_numbers=[2, 3],
            position=1,  # position index starts with 0
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
            ],
        )
        src_2_version = maker.document_version(
            page_count=3,
            pages_text=[
                "src 2 page 1",
                "src 2 page 2",
                "src 2 page 3",
            ],
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
            position=3,  # position index starts with 0
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
            text=itertools.cycle(
                [
                    "I am content from Page 1",
                    "I am content from Page 2",
                    "And I am content from Page 3",
                ]
            ),
        )
        doc_version_old = baker.make("core.DocumentVersion", pages=pages_old)
        # User deletes one page, which means
        # new document version will have 2 pages
        pages_new = baker.prepare("core.Page", _quantity=2)
        doc_version_new = baker.make("core.DocumentVersion", pages=pages_new)

        #  this is what is tested
        reuse_text_field(
            old_version=doc_version_old,
            new_version=doc_version_new,
            # TODO: replace list with PageRecycleMap
            page_map=[(1, 2), (2, 3)],
        )

        actual = [page.text for page in doc_version_new.pages.all()]
        expected = ["I am content from Page 2", "And I am content from Page 3"]

        assert expected == actual


class TestRemovePdfPages(TestCase):
    """Tests for remove_pdf_pages"""

    @patch("papermerge.core.signals.send_ocr_task")
    def test_remove_pdf_pages_basic_1(self, _):
        """Remove one page from the document version"""
        src_document = maker.document("s3.pdf", user=self.user)
        src_old_version = src_document.versions.last()
        src_new_version = src_document.version_bump(page_count=2)

        remove_pdf_pages(
            old_version=src_old_version, new_version=src_new_version, page_numbers=[1]
        )

        content = pdf_content(src_new_version, clean=True)
        assert content == "S2 S3"

    @patch("papermerge.core.signals.send_ocr_task")
    def test_remove_pdf_pages_basic_2(self, _):
        """Remove last two pages from the document version"""
        src_document = maker.document("s3.pdf", user=self.user)
        src_old_version = src_document.versions.last()
        src_new_version = src_document.version_bump(page_count=2)

        remove_pdf_pages(
            old_version=src_old_version,
            new_version=src_new_version,
            page_numbers=[2, 3],
        )

        content = pdf_content(src_new_version, clean=True)
        assert content == "S1"

    @patch("papermerge.core.signals.send_ocr_task")
    def test_remove_pdf_pages_invalid_input(self, _):
        """Junk page_numbers input"""
        src_document = maker.document("s3.pdf", user=self.user)
        src_old_version = src_document.versions.last()
        src_new_version = src_document.version_bump(page_count=2)

        with pytest.raises(ValueError):
            remove_pdf_pages(
                old_version=src_old_version,
                new_version=src_new_version,
                page_numbers=[],  # invalid, empty list
            )

        with pytest.raises(ValueError):
            remove_pdf_pages(
                old_version=src_old_version,
                new_version=src_new_version,
                page_numbers=[1, 2, 3, 4, 5, 6, 7],  # invalid, too many values
            )


class TestInserPdfPagesUtilityFunction(TestCase):
    """Tests for insert_pdf_pages"""

    @patch("papermerge.core.signals.send_ocr_task")
    def test_insert_pdf_pages_basic_1(self, _):
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
        src_document = maker.document("s3.pdf", user=self.user)
        src_old_version = src_document.versions.last()
        dst_document = maker.document("d3.pdf", user=self.user)
        dst_new_version = dst_document.version_bump(page_count=4)
        dst_old_version = dst_document.versions.first()

        insert_pdf_pages(
            src_old_version=src_old_version,
            dst_old_version=dst_old_version,
            dst_new_version=dst_new_version,
            src_page_numbers=[1],  # i.e. first page
            dst_position=0,
        )

        dst_new_content = pdf_content(dst_new_version, clean=True)
        assert "S1 D1 D2 D3" == dst_new_content

    @patch("papermerge.core.signals.send_ocr_task")
    def test_insert_pdf_pages_basic_2(self, _):
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
        src_document = maker.document("s3.pdf", user=self.user)
        src_old_version = src_document.versions.last()
        dst_document = maker.document("d3.pdf", user=self.user)
        dst_new_version = dst_document.version_bump(page_count=5)
        dst_old_version = dst_document.versions.first()

        insert_pdf_pages(
            src_old_version=src_old_version,
            dst_old_version=dst_old_version,
            dst_new_version=dst_new_version,
            src_page_numbers=[1, 3],
            dst_position=1,
        )

        dst_new_content = pdf_content(dst_new_version, clean=True)
        assert "D1 S1 S3 D2 D3" == dst_new_content

    @patch("papermerge.core.signals.send_ocr_task")
    def test_insert_pdf_pages_when_dst_old_is_None(self, _):
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
        src_document = maker.document("s3.pdf", user=self.user)
        src_old_version = src_document.versions.last()
        dst_document = maker.document("d3.pdf", user=self.user)
        dst_new_version = dst_document.version_bump(page_count=2)

        insert_pdf_pages(
            src_old_version=src_old_version,
            dst_old_version=None,
            dst_new_version=dst_new_version,
            src_page_numbers=[1, 3],
        )

        dst_new_content = pdf_content(dst_new_version, clean=True)
        assert "S1 S3" == dst_new_content


def _get_content(file_path: Path) -> str:
    """retrieves content of the file

    :param relative_url: relative path to the file
    """
    with open(file_path) as f:
        data = f.read()

    return data


def _assert_same_ocr_data(src: Page, dst: Page, message: str = None) -> None:
    """Asserts that src and dst pages have same OCR data"""
    src_txt = _get_content(src.txt_path)
    src_hocr = _get_content(src.hocr_path)
    src_svg = _get_content(src.svg_path)
    src_jpg = _get_content(src.jpg_path)
    dst_txt = _get_content(dst.txt_path)
    dst_hocr = _get_content(dst.hocr_path)
    dst_svg = _get_content(dst.svg_path)
    dst_jpg = _get_content(dst.jpg_path)

    assert dst_txt == src_txt, message
    assert dst_hocr == src_hocr, message
    assert dst_svg == src_svg, message
    assert dst_jpg == src_jpg, message
