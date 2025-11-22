from io import BytesIO

import pytest
from PIL import Image
from pikepdf import Pdf

from papermerge.core.types import MimeType
from papermerge.core.tests.types import DocumentTestFileType


@pytest.fixture
def make_document_file():
    """
    Factory fixture that creates valid file objects for different document types.
    Creates PDFs using pikepdf that can be parsed by pikepdf itself.

    Usage:
        file = make_document_file("pdf", "invoice.pdf")
        file = make_document_file("jpeg", "scan.jpg", width=1200, height=1600)
    """
    def _make_file(
        doc_type: MimeType,
        filename: str,
        width: int = 800,
        height: int = 1000,
        content: bytes | None = None,
        num_pages: int = 1
    ) -> DocumentTestFileType:
        """
        Create a file object for testing.

        Args:
            doc_type: Type of document (pdf, jpeg, png, tiff)
            filename: Name of the file
            width: Width for image files (default 800)
            height: Height for image files (default 1000)
            content: Optional custom binary content
            num_pages: Number of pages for PDF (default 1)

        Returns:
            Tuple of (filename, file_object, content_type) ready for httpx upload
        """
        if doc_type == "pdf":
            if content is None:
                # Create a proper PDF using pikepdf
                file_obj = BytesIO()

                # Create a new PDF
                pdf = Pdf.new()

                # Add blank pages
                for page_num in range(num_pages):
                    pdf.add_blank_page(page_size=(612, 792))  # Letter size

                # Save to BytesIO
                pdf.save(file_obj)
                file_obj.seek(0)
                pdf.close()
            else:
                file_obj = BytesIO(content)

            content_type = MimeType.application_pdf

        elif doc_type in ("jpeg", "jpg"):
            if content is None:
                # Create a simple JPEG image
                img = Image.new('RGB', (width, height), color='white')
                file_obj = BytesIO()
                img.save(file_obj, format='JPEG')
                file_obj.seek(0)
            else:
                file_obj = BytesIO(content)

            content_type = MimeType.image_jpeg

        elif doc_type == "png":
            if content is None:
                # Create a simple PNG image
                img = Image.new('RGB', (width, height), color='white')
                file_obj = BytesIO()
                img.save(file_obj, format='PNG')
                file_obj.seek(0)
            else:
                file_obj = BytesIO(content)

            content_type = MimeType.image_png

        elif doc_type == "tiff":
            if content is None:
                # Create a simple TIFF image
                img = Image.new('RGB', (width, height), color='white')
                file_obj = BytesIO()
                img.save(file_obj, format='TIFF')
                file_obj.seek(0)
            else:
                file_obj = BytesIO(content)

            content_type = MimeType.image_tiff

        else:
            raise ValueError(f"Unsupported document type: {doc_type}")

        return DocumentTestFileType(
            file_obj=file_obj,
            filename=filename,
            content_type=content_type
        )

    return _make_file

@pytest.fixture
def pdf_file(make_document_file):
    """Convenience fixture for a single PDF file"""
    return make_document_file("pdf", "test_document.pdf")


@pytest.fixture
def multi_page_pdf_file(make_document_file):
    """Convenience fixture for a multi-page PDF file"""
    return make_document_file("pdf", "test_multi_page.pdf", num_pages=5)


@pytest.fixture
def jpeg_file(make_document_file):
    """Convenience fixture for a single JPEG file"""
    return make_document_file("jpeg", "test_scan.jpg")


@pytest.fixture
def png_file(make_document_file):
    """Convenience fixture for a single PNG file"""
    return make_document_file("png", "test_image.png")


@pytest.fixture
def tiff_file(make_document_file):
    """Convenience fixture for a single TIFF file"""
    return make_document_file("tiff", "test_archive.tiff")


@pytest.fixture
def pdf_file(make_document_file):
    """Convenience fixture for a single PDF file"""
    return make_document_file("pdf", "test_document.pdf")


@pytest.fixture
def jpeg_file(make_document_file):
    """Convenience fixture for a single JPEG file"""
    return make_document_file("jpeg", "test_scan.jpg")


@pytest.fixture
def png_file(make_document_file):
    """Convenience fixture for a single PNG file"""
    return make_document_file("png", "test_image.png")


@pytest.fixture
def tiff_file(make_document_file):
    """Convenience fixture for a single TIFF file"""
    return make_document_file("tiff", "test_archive.tiff")
