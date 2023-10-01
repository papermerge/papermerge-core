import pytest

from papermerge.core.schemas.documents import DocumentVersion as PyDocumentVer
from papermerge.test import maker


@pytest.mark.django_db
def test_basic_document_version():
    """assert that document version instance can be validated
    via pydantic mode_validate"""
    doc_ver = maker.document_version(page_count=2, lang='fra')

    pydoc: PyDocumentVer = PyDocumentVer.model_validate(doc_ver)

    assert pydoc.number == 1
    assert pydoc.size == 0
    assert pydoc.lang == 'fra'
    assert pydoc.download_url
