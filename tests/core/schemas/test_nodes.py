import pytest
from papermerge.core.models import User, Document
from papermerge.core.schemas.nodes import Node as PyNode
from papermerge.core.schemas.nodes import NodeType


@pytest.mark.django_db
def test_nodes(user: User):
    doc = Document.objects.create_document(
        title="invoice.pdf",
        lang="deu",
        user_id=user.pk,
        parent=user.home_folder
    )
    pynode = PyNode.from_orm(doc)

    assert pynode.title == "invoice.pdf"
    assert pynode.ctype == NodeType.document
