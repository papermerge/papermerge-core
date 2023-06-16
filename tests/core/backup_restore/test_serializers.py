import pytest

from papermerge.core.backup_restore.serializers import (
    DocumentSerializer, FolderSerializer, UserSerializer,
    restore_nodes_hierarchy)
from papermerge.core.models import Document, Folder, User
from papermerge.test.baker_recipes import user_recipe


@pytest.mark.skip()
@pytest.mark.django_db
def test_serialize_multiple_users(two_users: list):
    user_ser = UserSerializer(data=two_users, many=True)

    assert User.objects.count() == 0

    user_ser.is_valid(raise_exception=True)
    user_ser.save()

    assert User.objects.count() == 2


@pytest.mark.skip()
@pytest.mark.django_db
def test_node_deserialization_when_node_is_a_folder(my_documents: dict):
    user = user_recipe.make(username='username1')

    folder_ser = FolderSerializer(data=my_documents)
    if folder_ser.is_valid():
        folder_ser.save(user=user)

    assert Folder.objects.filter(user=user).count() == 3


@pytest.mark.skip()
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


@pytest.mark.skip()
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


@pytest.mark.skip()
@pytest.mark.django_db
def test_restore_nodes_hierarchy(nodes_hierarchy: list):
    user = user_recipe.make(username='username1')
    restore_nodes_hierarchy(nodes_hierarchy, user)

    found = Folder.objects.get_by_breadcrumb(
        '.home/My Invoices/Super/Deep/',
        user
    )
    assert found is not None
    assert found.breadcrumb == '.home/My Invoices/Super/Deep/'
    assert found.title == 'Deep'

    found = Folder.objects.get_by_breadcrumb(
        '.home/My Documents/',
        user
    )
    assert found is not None
    assert found.breadcrumb == '.home/My Documents/'
    assert found.title == 'My Documents'

    found = Document.objects.get_by_breadcrumb(
        '.home/My Documents/ticket.pdf',
        user
    )
    assert found is not None
    assert found.breadcrumb == '.home/My Documents/ticket.pdf'


@pytest.mark.skip()
@pytest.mark.django_db
def test_one_user_with_one_tag(one_user_with_one_tag):
    user_ser = UserSerializer(
        data=one_user_with_one_tag
    )
    user_ser.is_valid(raise_exception=True)
    user = user_ser.save()

    assert user.tags.count() == 1
    assert 'important' in [tag.name for tag in user.tags.all()]


@pytest.mark.skip()
@pytest.mark.django_db
def test_tagged_nodes(tata_user):
    """
    In this scenario user has tagged nodes.
    Also, user has a couple of unused tags (i.e. tags not
    associated with any particular node)
    """
    user_ser = UserSerializer(
        data=tata_user
    )
    user_ser.is_valid(raise_exception=True)
    user = user_ser.save(nodes=tata_user['nodes'])
    assert user is not None
    assert user.tags.count() == 2

    folder = Folder.objects.get_by_breadcrumb(
        '.home/My Receipts/',
        user=user
    )
    tag = folder.tags.first()
    assert tag.name == 'important'

    document = Document.objects.get_by_breadcrumb(
        '.home/Anmeldung-2016.pdf',
        user=user
    )
    tag = document.tags.first()
    assert tag.name == 'important'
