import unittest

from papermerge.core.lib.path import (
    DocumentPath, PagePath
)


class TestDocumentPath(unittest.TestCase):

    def test_document_url(self):
        document_path = DocumentPath(
            user_id=1,
            document_id=3,
            file_name="x.pdf"
        )
        self.assertEqual(
            document_path.url,
            "docs/user_1/document_3/x.pdf"
        )

    def test_document_url_with_another_version(self):
        doc_path = DocumentPath(
            user_id=1,
            document_id=15,
            file_name="x.pdf",
            version=3
        )
        self.assertEqual(
            doc_path.url,
            "docs/user_1/document_15/v3/x.pdf"
        )

    def test_dirname(self):
        document_path = DocumentPath(
            user_id=1,
            document_id=3,
            aux_dir="results",
            file_name="x.pdf"
        )
        self.assertEqual(
            document_path.dirname(),
            "results/user_1/document_3/"
        )

    def test_pages_dirname(self):
        document_path = DocumentPath(
            user_id=1,
            document_id=3,
            aux_dir="results",
            file_name="x.pdf"
        )
        self.assertEqual(
            document_path.pages_dirname(),
            "results/user_1/document_3/pages/"
        )


class TestPagePath(unittest.TestCase):

    def test_versioned_page_ep(self):
        doc_path = DocumentPath(
            user_id=1,
            document_id=3,
            file_name="x.pdf",
            version=1
        )
        page_path = PagePath(
            document_path=doc_path,
            page_num=1,
        )
        self.assertEqual(
            page_path.url,
            "sidecars/user_1/document_3/v1/pages/000001/000001_ocr_hocr.txt"
        )
