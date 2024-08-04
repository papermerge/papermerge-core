import json
import uuid

import pytest
from django.urls import reverse

from papermerge.core.models import Document, Folder, Tag
from papermerge.test import TestCase
from papermerge.test.baker_recipes import document_recipe, folder_recipe
from papermerge.test.types import AuthTestClient


@pytest.mark.skip()
class NodesViewTestCase(TestCase):

    def test_get_inboxcount_when_inbox_is_empty(self):
        """
        GET /nodes/inboxcount/ returns number of descendants of user's inbox
        folder.

        In this test user's inbox is empty.
        """
        response = self.client.get(reverse('inboxcount'))

        assert response.status_code == 200

        # user's inbox is empty
        assert response.data == {'count': 0}

    def test_get_inboxcount_with_one_item_in_inbox(self):
        """
        GET /nodes/inboxcount/ returns number of descendants of user's inbox
        folder.
        In this test user's inbox contains one single item (one folder).
        """
        Folder.objects.create(
            title='I am inside .inbox',
            user=self.user,
            parent=self.user.inbox_folder
        )
        response = self.client.get(reverse('inboxcount'))
        assert response.status_code == 200

        # user's inbox contains one item
        assert response.data == {'count': 1}

    def test_get_inboxcount_containing_recursive_items(self):
        """
        Inbox folder contains two folders:
        - My Documents
        - My Invoices

        Both My Documents and My Invoices contains another two documents:
        - My Documents
            - doc1.pdf
            - doc2.pdf
        - My Invoices
            - invoice1.pdf
            - invoice2.pdf

        In such case, inbox should show item count = 2, which corresponds to the
        two direct children of the inbox - 'My Documents' and 'My Invoices'
        """
        my_documents = Folder.objects.create(
            title='My Documents',
            user=self.user,
            parent=self.user.inbox_folder
        )
        Document.objects.create(
            title='doc1.pdf',
            user=self.user,
            parent=my_documents
        )
        Document.objects.create(
            title='doc2.pdf',
            user=self.user,
            parent=my_documents
        )
        my_invoices = Folder.objects.create(
            title='My Invoices',
            user=self.user,
            parent=self.user.inbox_folder
        )
        Document.objects.create(
            title='invoice1.pdf',
            user=self.user,
            parent=my_invoices
        )
        Document.objects.create(
            title='invoice2.pdf',
            user=self.user,
            parent=my_invoices
        )

        response = self.client.get(reverse('inboxcount'))
        assert response.status_code == 200

        # user's inbox contains one item
        assert response.data == {'count': 2}

    def test_nodes_move(self):
        doc = Document.objects.create(
            title='doc.pdf',
            user=self.user,
            parent=self.user.inbox_folder
        )

        url = reverse('nodes-move')
        data = {
            'nodes': [
                {'id': str(doc.id)}
            ],
            'target_parent': {
                'id': str(self.user.home_folder.id)
            }
        }

        response = self.client.post(
            url,
            json.dumps(data),
            content_type='application/json'
        )

        assert response.status_code == 200, response.data


@pytest.mark.django_db(transaction=True)
def test_create_document_with_custom_id(auth_api_client: AuthTestClient):
    """
    Allow custom ID attribute: if ID attribute is set, then node will set it
    as its ID.
    """
    assert Document.objects.count() == 0

    user = auth_api_client.user

    custom_id = uuid.uuid4()

    payload = dict(
        id=str(custom_id),
        ctype='document',
        # "lang" attribute is not set
        title='doc1.pdf',
        parent_id=str(user.home_folder.pk)
    )

    response = auth_api_client.post('/nodes', json=payload)

    assert response.status_code == 201, response.content
    assert Document.objects.count() == 1
    doc = Document.objects.first()
    assert doc.id == custom_id


@pytest.mark.django_db(transaction=True)
def test_create_folder_with_custom_id(auth_api_client: AuthTestClient):
    """
    Allow custom ID attribute: if ID attribute is set, then node will set it
    as its ID.
    """
    user = auth_api_client.user

    custom_id = uuid.uuid4()

    payload = dict(
        id=str(custom_id),
        ctype='folder',
        title='My Documents',
        parent_id=str(user.home_folder.pk)
    )

    response = auth_api_client.post('/nodes', json=payload)
    folder = Folder.objects.get(title='My Documents')

    assert response.status_code == 201, response.content
    assert folder.id == custom_id


@pytest.mark.django_db(transaction=True)
def test_create_document(auth_api_client: AuthTestClient):
    """
    When 'lang' attribute is not specified during document creation
    it is set from user preferences['ocr_language']
    """
    assert Document.objects.count() == 0

    user = auth_api_client.user

    payload = {
        'ctype': 'document',
        # "lang" attribute is not set
        'title': 'doc1.pdf',
        'parent_id': str(user.home_folder.pk)
    }

    response = auth_api_client.post('/nodes', json=payload)

    assert response.status_code == 201, response.content
    assert Document.objects.count() == 1


@pytest.mark.django_db(transaction=True)
def test_two_folders_with_same_title_under_same_parent(
    auth_api_client: AuthTestClient
):
    """It should not be possible to create two folders with
    same (parent, title) pair i.e. we cannot have folders with same
    title under same parent
    """
    user = auth_api_client.user
    payload = {
        "ctype": "folder",
        "title": "My Documents",
        "parent_id": str(user.home_folder.pk)
    }

    # Create first folder 'My documents' (inside home folder)
    response = auth_api_client.post('/nodes', json=payload)
    assert response.status_code == 201

    # Create second folder 'My Documents' also inside home folder
    response = auth_api_client.post('/nodes', json=payload)
    assert response.status_code == 400
    assert response.json() == {'detail': 'Title already exists'}


@pytest.mark.django_db(transaction=True)
def test_two_folders_with_same_title_under_different_parents(
    auth_api_client: AuthTestClient
):
    """It should be possible to create two folders with
    same title if they are under different parents.
    """
    user = auth_api_client.user
    payload = {
        "ctype": "folder",
        "title": "My Documents",
        "parent_id": str(user.home_folder.pk)
    }

    # Create first folder 'My documents' (inside home folder)
    response = auth_api_client.post('/nodes', json=payload)
    assert response.status_code == 201

    # Create second folder 'My Documents' also inside home folder
    payload2 = {
        "ctype": "folder",
        "title": "My Documents",
        "parent_id": str(user.inbox_folder.pk)
    }

    # create folder 'My Documents' in Inbox
    response = auth_api_client.post('/nodes', json=payload2)
    assert response.status_code == 201


@pytest.mark.django_db(transaction=True)
def test_two_documents_with_same_title_under_same_parent(
    auth_api_client: AuthTestClient
):
    """It should NOT be possible to create two documents with
    same (parent, title) pair i.e. we cannot have documents with same
    title under same parent
    """
    user = auth_api_client.user
    payload = {
        "ctype": "document",
        "title": "My Documents",
        "parent_id": str(user.home_folder.pk)
    }

    # Create first folder 'My documents' (inside home folder)
    response = auth_api_client.post('/nodes', json=payload)
    assert response.status_code == 201

    # Create second folder 'My Documents' also inside home folder
    response = auth_api_client.post('/nodes', json=payload)

    assert response.status_code == 400
    assert response.json() == {'detail': 'Title already exists'}


@pytest.mark.django_db(transaction=True)
def test_assign_tags_to_non_tagged_folder(auth_api_client: AuthTestClient):
    """
    url:
        POST /api/nodes/{node_id}/tags
    body content:
        ["paid", "important"]

    where N1 is a folder without any tag

    Expected result:
        folder N1 will have two tags assigned: 'paid' and 'important'
    """
    receipts = folder_recipe.make(
        title='Receipts',
        user=auth_api_client.user,
        parent=auth_api_client.user.inbox_folder
    )
    payload = ['paid', 'important']

    response = auth_api_client.post(
        f'/nodes/{receipts.pk}/tags',
        json=payload
    )

    assert response.status_code == 200

    folder = Folder.objects.get(title='Receipts', user=auth_api_client.user)
    assert folder.tags.count() == 2


@pytest.mark.django_db(transaction=True)
def test_assign_tags_to_tagged_folder(auth_api_client: AuthTestClient):
    """
    url:
        POST /api/nodes/{N1}/tags/
    body content:
        ["paid", "important"]

    where N1 is a folder with two tags 'important' and 'unpaid' already
    assigned

    Expected result:
        folder N1 will have two tags assigned: 'paid' and 'important'.
        Tag 'unpaid' will be dissociated from the folder.
    """
    u = auth_api_client.user
    receipts = Folder.objects.create(
        title='Receipts',
        user=u,
        parent=u.inbox_folder
    )
    receipts.tags.set(
        ['unpaid', 'important'],
        tag_kwargs={"user": u}
    )
    payload = ['paid', 'important']

    response = auth_api_client.post(
        f'/nodes/{receipts.pk}/tags',
        json=payload,
    )

    assert response.status_code == 200

    folder = Folder.objects.get(title='Receipts', user=u)
    assert folder.tags.count() == 2
    all_new_tags = [tag.name for tag in folder.tags.all()]
    # tag 'unpaid' is not attached to folder anymore
    assert set(all_new_tags) == {'paid', 'important'}
    # model for tag 'unpaid' still exists, it was just
    # dissociated from folder 'Receipts'
    assert Tag.objects.get(name='unpaid')


@pytest.mark.django_db(transaction=True)
def test_assign_tags_to_document(auth_api_client: AuthTestClient):
    """
    url:
        POST /api/nodes/{D1}/tags/
    body content:
        ["xyz"]

    where D1 is a document

    Expected result:
        document D1 will have one tag assigned 'xyz'
    """
    u = auth_api_client.user
    d1 = document_recipe.make(
        title='invoice.pdf',
        user=u,
        parent=u.home_folder
    )
    d1.tags.set(
        ['unpaid', 'important'],
        tag_kwargs={"user": u}
    )
    payload = ['xyz']

    response = auth_api_client.post(
        f'/nodes/{d1.pk}/tags',
        json=payload,
    )

    assert response.status_code == 200

    found_d1 = Document.objects.get(title='invoice.pdf', user=u)
    assert found_d1.tags.count() == 1
    all_new_tags = [tag.name for tag in found_d1.tags.all()]

    assert set(all_new_tags) == {'xyz'}


@pytest.mark.django_db(transaction=True)
def test_append_tags_to_folder(auth_api_client: AuthTestClient):
    """
    url:
        PATCH /api/nodes/{N1}/tags/
    body content:
        ["paid"]

    where N1 is a folder with already one tag attached: 'important'

    Expected result:
        folder N1 will have two tags assigned: 'paid' and 'important'
        Notice that 'paid' was appended next to 'important'.
    """
    u = auth_api_client.user
    receipts = Folder.objects.create(
        title='Receipts',
        user=u,
        parent=u.inbox_folder
    )
    receipts.tags.set(
        ['important'],
        tag_kwargs={"user": u}
    )
    payload = ['paid']
    response = auth_api_client.patch(
        f'/nodes/{receipts.pk}/tags',
        json=payload,
    )

    assert response.status_code == 200, response.json()
    folder = Folder.objects.get(title='Receipts', user=u)
    assert folder.tags.count() == 2
    all_new_tags = [tag.name for tag in receipts.tags.all()]

    assert set(all_new_tags) == {'paid', 'important'}


@pytest.mark.django_db(transaction=True)
def test_remove_tags_from_folder(auth_api_client: AuthTestClient):
    """
    url:
        DELETE /api/nodes/{N1}/tags/
    body content:
        ["important"]

    where N1 is a folder with four tags 'important', 'paid', 'receipt',
    'bakery'

    Expected result:
        folder N1 will have three tags assigned: 'paid', 'bakery', 'receipt'
    """
    u = auth_api_client.user
    receipts = Folder.objects.create(
        title='Receipts',
        user=u,
        parent=u.inbox_folder
    )
    receipts.tags.set(
        ['important', 'paid', 'receipt', 'bakery'],
        tag_kwargs={"user": u}
    )
    payload = ['important']
    response = auth_api_client.delete(
        f'/nodes/{receipts.pk}/tags',
        json=payload,
    )

    assert response.status_code == 200, response.json()

    folder = Folder.objects.get(title='Receipts', user=u)
    assert folder.tags.count() == 3
    all_new_tags = [tag.name for tag in receipts.tags.all()]
    assert set(all_new_tags) == {'paid', 'bakery', 'receipt'}


@pytest.mark.django_db(transaction=True)
def test_home_with_two_tagged_nodes(auth_api_client: AuthTestClient):
    """
    Create two tagged nodes (one folder and one document) in user's home.
    Retrieve user's home content and check that tags
    were included in response as well.
    """
    u = auth_api_client.user
    folder = Folder.objects.create(
        title='folder',
        user=u,
        parent=u.home_folder
    )
    folder.tags.set(
        ['folder_a', 'folder_b'],
        tag_kwargs={"user": u}
    )
    doc = Document.objects.create(
        title='doc.pdf',
        user=u,
        parent=u.home_folder
    )
    doc.tags.set(
        ['doc_a', 'doc_b'],
        tag_kwargs={"user": u}
    )
    home = u.home_folder

    response = auth_api_client.get(f'/nodes/{home.pk}')
    assert response.status_code == 200

    results = response.json()['items']
    assert len(results) == 2  # there are two folders

    doc_tag_names = [tag['name'] for tag in results[0]['tags']]
    folder_tag_names = [tag['name'] for tag in results[1]['tags']]

    assert {'doc_a', 'doc_b'} == set(doc_tag_names)
    assert {'folder_a', 'folder_b'} == set(folder_tag_names)


@pytest.mark.django_db(transaction=True)
def test_rename_folder(auth_api_client: AuthTestClient):
    user = auth_api_client.user
    folder = folder_recipe.make(
        title='Old Title',
        user=user,
        parent=user.home_folder
    )

    response = auth_api_client.patch(
        f'/nodes/{folder.id}',
        json={'title': 'New Title'}
    )

    assert response.status_code == 200, response.content

    renamed_folder: Folder = Folder.objects.get(pk=folder.pk)
    assert renamed_folder.title == 'New Title'
