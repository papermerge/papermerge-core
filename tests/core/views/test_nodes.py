import json

from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient

from papermerge.core.models import (
    User,
    Folder,
    Document,
    Tag
)


class NodesViewTestCase(TestCase):

    def setUp(self):
        self.user = User.objects.create_user(username="user1")
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

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

    def test_assign_tags_to_non_tagged_folder(self):
        """
        url:
            POST /api/nodes/{N1}/tags/
        body content:
            ["paid", "important"]

        where N1 is a folder without any tag

        Expected result:
            folder N1 will have two tags assigned: 'paid' and 'important'
        """
        receipts = Folder.objects.create(
            title='Receipts',
            user=self.user,
            parent=self.user.inbox_folder
        )
        data = {
            'tags': ['paid', 'important']
        }
        url = reverse('node-tags', args=(receipts.pk, ))
        response = self.client.post(
            url,
            data=json.dumps(data),
            content_type='application/json'
        )

        assert response.status_code == 201
        assert receipts.tags.count() == 2

    def test_assign_tags_to_tagged_folder(self):
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
        receipts = Folder.objects.create(
            title='Receipts',
            user=self.user,
            parent=self.user.inbox_folder
        )
        receipts.tags.set(
            ['unpaid', 'important'],
            tag_kwargs={"user": self.user}
        )
        data = {
            'tags': ['paid', 'important']
        }
        url = reverse('node-tags', args=(receipts.pk, ))
        response = self.client.post(
            url,
            data=json.dumps(data),
            content_type='application/json'
        )

        assert response.status_code == 201
        assert receipts.tags.count() == 2
        all_new_tags = [tag.name for tag in receipts.tags.all()]
        # tag 'unpaid' is not attached to folder anymore
        assert set(all_new_tags) == set(['paid', 'important'])
        # model for tag 'unpaid' still exists, it was just
        # dissociated from folder 'Receipts'
        assert Tag.objects.get(name='unpaid')

    def test_append_tags_to_folder(self):
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
        receipts = Folder.objects.create(
            title='Receipts',
            user=self.user,
            parent=self.user.inbox_folder
        )
        receipts.tags.set(
            ['important'],
            tag_kwargs={"user": self.user}
        )
        data = {
            'tags': ['paid']
        }
        url = reverse('node-tags', args=(receipts.pk, ))
        response = self.client.patch(
            url,
            data=json.dumps(data),
            content_type='application/json'
        )

        assert response.status_code == 200
        assert receipts.tags.count() == 2
        all_new_tags = [tag.name for tag in receipts.tags.all()]
        assert set(all_new_tags) == set(['paid', 'important'])

    def test_remove_tags_from_folder(self):
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
        receipts = Folder.objects.create(
            title='Receipts',
            user=self.user,
            parent=self.user.inbox_folder
        )
        receipts.tags.set(
            ['important', 'paid', 'receipt', 'bakery'],
            tag_kwargs={"user": self.user}
        )
        data = {
            'tags': ['important']
        }
        url = reverse('node-tags', args=(receipts.pk, ))
        response = self.client.delete(
            url,
            data=json.dumps(data),
            content_type='application/json'
        )

        assert response.status_code == 204
        assert receipts.tags.count() == 3
        all_new_tags = [tag.name for tag in receipts.tags.all()]
        assert set(all_new_tags) == set(['paid', 'bakery', 'receipt'])

    def test_home_with_two_tagged_nodes(self):
        """
        Create two tagged nodes (one folder and one document) in user's home.
        Retrieve user's home content and check that tags
        were included in response as well.
        """
        folder = Folder.objects.create(
            title='folder',
            user=self.user,
            parent=self.user.home_folder
        )
        folder.tags.set(
            ['folder_a', 'folder_b'],
            tag_kwargs={"user": self.user}
        )
        doc = Document.objects.create(
            title='doc.pdf',
            user=self.user,
            parent=self.user.home_folder
        )
        doc.tags.set(
            ['doc_a', 'doc_b'],
            tag_kwargs={"user": self.user}
        )
        home = self.user.home_folder
        url = reverse('node-detail', args=(home.pk, ))

        response = self.client.get(url)
        assert response.status_code == 200
        results = response.data['results']
        assert len(results) == 2  # there are two folders

        doc_tag_names = [tag['name'] for tag in results[0]['tags']]
        folder_tag_names = [tag['name'] for tag in results[1]['tags']]

        assert set(['doc_a', 'doc_b']) == set(doc_tag_names)
        assert set(['folder_a', 'folder_b']) == set(folder_tag_names)
