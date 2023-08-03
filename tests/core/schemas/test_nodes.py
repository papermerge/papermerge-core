import pytest

from papermerge.core.models import BaseTreeNode, Document, User
from papermerge.core.schemas.nodes import Node as PyNode
from papermerge.core.schemas.nodes import NodeType
from papermerge.core.types import OCRStatusEnum
from papermerge.test.baker_recipes import document_recipe, node_recipe


@pytest.mark.django_db
def test_pynode_from_document(user: User):
    doc = Document.objects.create_document(
        title="invoice.pdf",
        lang="deu",
        user_id=user.pk,
        parent=user.home_folder
    )
    pynode = PyNode.model_validate(doc)

    assert pynode.title == "invoice.pdf"
    assert pynode.ctype == NodeType.document


@pytest.mark.django_db
def test_pynode_from_basetreenode_with_ocr_status_unkown(user: User):
    document_recipe.make(
        title='invoice.pdf',
        user=user,
        parent=user.home_folder
    )
    node = BaseTreeNode.objects.get(title='invoice.pdf')

    pynode = PyNode.model_validate(node)

    assert pynode.title == "invoice.pdf"
    assert pynode.ctype == NodeType.document
    assert pynode.document.ocr_status == OCRStatusEnum.unknown


@pytest.mark.django_db
def test_pynode_from_basetreenode_with_ocr_status_success(user: User):
    doc = document_recipe.make(
        title='invoice.pdf',
        user=user,
        parent=user.home_folder,
        ocr_status=OCRStatusEnum.success
    )
    node = BaseTreeNode.objects.get(title='invoice.pdf')
    pynode = PyNode.model_validate(node)

    assert pynode.title == "invoice.pdf"
    assert pynode.ctype == NodeType.document
    assert pynode.document.ocr_status == OCRStatusEnum.success
    assert pynode.document.thumbnail_url == f"/api/thumbnails/{doc.id}"


@pytest.mark.django_db
def test_pynode_model_validate_with_tags(user: User):
    node = node_recipe.make(ctype='folder')

    node.tags.set(['one', 'two'], tag_kwargs={"user": user})

    pynode = PyNode.model_validate(node)

    assert {tag.name for tag in pynode.tags} == {'one', 'two'}
