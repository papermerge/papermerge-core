import pytest

from papermerge.core.models import User, Folder, Document
from papermerge.core.backup_restore.serializers import (
    UserSerializer,
    FolderSerializer,
    DocumentSerializer
)
from papermerge.test.baker_recipes import user_recipe


@pytest.mark.django_db
def test_serialize_multiple_users(two_users: list):
    user_ser = UserSerializer(data=two_users, many=True)

    assert User.objects.count() == 0
    if user_ser.is_valid():
        user_ser.save()

    assert User.objects.count() == 2


@pytest.mark.django_db
def test_node_deserialization_when_node_is_a_folder(my_documents: dict):
    user = user_recipe.make(username='username1')

    folder_ser = FolderSerializer(data=my_documents)
    if folder_ser.is_valid():
        folder_ser.save(user=user)

    assert Folder.objects.filter(user=user).count() == 3


@pytest.mark.django_db
def test_node_deserialization_when_node_is_document(ticket_pdf: dict):
    user = user_recipe.make(username='username1')

    doc_ser = DocumentSerializer(data=ticket_pdf)
    doc_ser.is_valid(raise_exception=True)
    doc_ser.save(user=user)

    doc = Document.objects.get(user=user, title='ticket.pdf')
    doc_ver = doc.versions.first()

    assert str(doc.id) == ticket_pdf['id']
    assert doc.versions.count() == 1
    assert doc_ver.pages.count() == 1
    assert doc_ver.pages.first().text == 'blah XYZ'


@pytest.mark.django_db
def test_document_deserialization(two_versions_doc: dict):
    user = user_recipe.make(username='username1')

    doc_ser = DocumentSerializer(data=two_versions_doc)

    doc_ser.is_valid(raise_exception=True)
    doc_ser.save(user=user)

    doc = Document.objects.get(user=user, title='duo-versus.pdf')
    doc_ver_1 = doc.versions.filter(number=1)[0]
    doc_ver_2 = doc.versions.filter(number=2)[0]

    assert str(doc.id) == two_versions_doc['id']
    assert doc.versions.count() == 2
    assert doc_ver_1.pages.count() == 2
    assert doc_ver_2.pages.count() == 2

    version_2_page_content = [page.text for page in doc_ver_2.pages.all()]

    assert "CIUR" in ' '.join(version_2_page_content)
    assert "Helsinki" in ' '.join(version_2_page_content)


@pytest.mark.django_db
def test_restore_nodes_hierarchy():
    pass
