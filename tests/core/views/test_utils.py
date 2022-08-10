import re
import pytest

from papermerge.test import TestCase
from papermerge.test import maker
from papermerge.test.utils import pdf_content

from papermerge.core.views.utils import (
    total_merge,
    partial_merge,
    insert_pdf_pages
)
from papermerge.core.models import Document


class TestInserPdfPagesUtilityFunction(TestCase):
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

        dst_new_content = pdf_content(dst_new_version)
        dst_new_content_clean = re.sub('[^0-9a-zA-Z]+', ' ', dst_new_content)
        assert "S1 D1 D2 D3" == dst_new_content_clean

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

        dst_new_content = pdf_content(dst_new_version)
        dst_new_content_clean = re.sub('[^0-9a-zA-Z]+', ' ', dst_new_content)
        assert "D1 S1 S3 D2 D3" == dst_new_content_clean

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

        dst_new_content = pdf_content(dst_new_version)
        dst_new_content_clean = re.sub('[^0-9a-zA-Z]+', ' ', dst_new_content)
        assert "S1 S3" == dst_new_content_clean


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
