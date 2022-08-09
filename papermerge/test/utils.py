from pdfminer.high_level import extract_text
from papermerge.core.models import DocumentVersion
from papermerge.core.storage import abs_path


def pdf_content(document_version: DocumentVersion) -> str:
    """Returns text content of file associated with given document version"""
    file_path = abs_path(document_version.document_path.url)
    text = extract_text(file_path)

    return text.strip()
