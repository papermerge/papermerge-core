import pytest

from papermerge.core.models import Document, User
from papermerge.core.schemas.documents import Document as PyDocument


@pytest.mark.django_db
def test_documents(user: User):
    doc = Document.objects.create_document(
        title="invoice.pdf",
        lang="deu",
        user_id=user.pk,
        parent=user.home_folder
    )

    pydoc: PyDocument = PyDocument.model_validate(doc)

    assert pydoc.title == "invoice.pdf"
    assert len(pydoc.versions) == 1
    assert pydoc.versions[0].size == 0
    assert len(pydoc.versions[0].pages) == 0
