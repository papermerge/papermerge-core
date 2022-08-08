import pytest

from papermerge.test import TestCase
from papermerge.test import maker
from papermerge.test.utils import pdf_content

from papermerge.core.views.utils import total_merge
from papermerge.core.models import Document


class TestUtils(TestCase):

    def test_total_merge_of_two_one_page_documents(self):
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
            src_old_version=src_document,
            dst_new_version=dst_new_version
        )

        # 1. src_document must be deleted by now
        with pytest.raises(Document.DoesNotExist):
            Document.objects.get(src_document.pk)

        # 2. dst document's first version must contain one page
        # with "Scan v1" text
        first_version = dst_document.versions()[0]
        assert first_version.pages.count == 1
        assert "Scan v1" == pdf_content(first_version.pages[0])

        second_version = dst_document.versions()[1]
        # 3. dst document's last version must contain one page
        # with "Scan v2" text
        assert second_version.pages.count == 1
        assert "Scan v1" == pdf_content(second_version.pages[0])
