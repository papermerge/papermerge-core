import io
import json
import os
import shutil
from pathlib import Path
from unittest.mock import patch

import pytest
from django.test import TestCase
from django.urls import reverse
from haystack import connections
from haystack.utils.loading import UnifiedIndex
from rest_framework.test import APIClient

from papermerge.core.models import Document, Folder, User

SEARCH_DIR_ABS_PATH = os.path.abspath(os.path.dirname(__file__))
TEST_DIR_ABS_PATH = os.path.dirname(SEARCH_DIR_ABS_PATH)


def rebuild_index():
    search_backend = connections["default"].get_backend()
    search_backend.clear()
    index1 = UnifiedIndex().get_index(Document)
    search_backend.update(index1, Document.objects.all())
    index2 = UnifiedIndex().get_index(Folder)
    search_backend.update(index2, Folder.objects.all())


@pytest.mark.skip()
class SearchViewVeryBasicTestCase(TestCase):

    def setUp(self):
        super().setUp()
        self.user1 = User.objects.create_user(username="user1")
        self.user2 = User.objects.create_user(username="user2")
        self.user3 = User.objects.create_user(username="user3")
        self.client = APIClient()
        self.client.force_authenticate(user=self.user1)
        self.resources = Path(TEST_DIR_ABS_PATH) / 'resources'
        self.media = Path(TEST_DIR_ABS_PATH) / 'media'
        shutil.rmtree(self.media / 'docs', ignore_errors=True)
        shutil.rmtree(self.media / 'sidecars', ignore_errors=True)
        rebuild_index()

    def test_search_empty_string_search(self):
        """
        Make sure that when searching by empty string (i.e. user
        just presses space in search box) only nodes of current
        user are returned.

        In this scenario there are three users: user1, user2, user3.
        User1 is currently authenticated.
        User1 did not create any new node (folder or document).

        Searching by empty string must return only two items: user's '.inbox'
        and '.home' folders. Both '.inbox' and '.home' folders are created by
        default when user is created.
        """
        expected_titles = ('.inbox', '.home')

        # empty search
        response = self.client.get(
            reverse('search'),
            {'q': ''}  # empty search string
        )
        assert response.status_code == 200

        data = json.loads(response.content)

        # search returns only two items: .inbox and .home
        assert len(data) == 2
        assert data[0]['title'] in expected_titles
        assert data[1]['title'] in expected_titles

    def test_search_without_query_parameter(self):
        """
        Invoking search without query parameter ('q') should
        have same effect as searching with empty query parameter i.e.
        q=''.
        """
        expected_titles = ('.inbox', '.home')

        # no search query parameter provided
        response = self.client.get(reverse('search'))
        assert response.status_code == 200

        data = json.loads(response.content)
        # result should be same as when searching by empty
        # query parameter i.e. search returns only two items: .inbox and .home
        assert len(data) == 2
        assert data[0]['title'] in expected_titles
        assert data[1]['title'] in expected_titles


@pytest.mark.skip()
class SearchFolderTestCase(TestCase):
    def setUp(self):
        super().setUp()
        self.user = User.objects.create_user(username="user")
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)
        self.resources = Path(TEST_DIR_ABS_PATH) / 'resources'
        self.media = Path(TEST_DIR_ABS_PATH) / 'media'
        shutil.rmtree(self.media / 'docs', ignore_errors=True)
        shutil.rmtree(self.media / 'sidecars', ignore_errors=True)
        Folder.objects.create(
            title="Invoices",
            user=self.user,
            parent=self.user.home_folder
        )
        rebuild_index()

    def test_invoices_folder_is_searchable_with_exact_match(self):
        """
        Make sure that folder "Invoices" can be found / is searchable
        when user types exact name 'Invoices'
        """
        response = self.client.get(
            reverse('search'),
            {'q': 'Invoices'}
        )
        assert response.status_code == 200

        data = json.loads(response.content)
        assert len(data) == 1
        assert data[0]['title'] == 'Invoices'

    def test_invoices_folder_is_searchable_with_wildcard_match(self):
        """
        Make sure that folder "Invoices" can be found / is searchable
        when user types lowercase "inv"
        """
        response = self.client.get(
            reverse('search'),
            {'q': 'inv'}
        )
        assert response.status_code == 200

        data = json.loads(response.content)
        assert len(data) == 1
        assert data[0]['title'] == 'Invoices'


@pytest.mark.skip()
class SearchDocumentTestCase(TestCase):

    def setUp(self):
        super().setUp()
        self.user = User.objects.create_user(username="user")
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)
        self.resources = Path(TEST_DIR_ABS_PATH) / 'resources'
        self.media = Path(TEST_DIR_ABS_PATH) / 'media'
        shutil.rmtree(self.media / 'docs', ignore_errors=True)
        shutil.rmtree(self.media / 'sidecars', ignore_errors=True)
        doc = Document.objects.create_document(
            title='Invoices.pdf',
            lang='deu',
            user_id=self.user.pk,
            parent=self.user.home_folder,
        )
        self.doc_version = doc.versions.last()
        self.doc_version.create_pages(page_count=2)
        self.doc_version.update_text_field([
            io.StringIO('I am page number one'),
            io.StringIO('I am page number two')
        ])
        rebuild_index()

    def test_document_search_by_text(self):
        """
        Make sure that folder "Invoices" can be found / is searchable
        when user types exact name 'Invoices'
        """
        response = self.client.get(
            reverse('search'),
            {'q': 'number one'}
        )
        assert response.status_code == 200

        data = json.loads(response.content)
        assert len(data) == 1
        assert 'page number one' in data[0]['text']


@pytest.mark.skip()
class SearchAfterMoveToFolder(TestCase):
    """
    There is a document 'living-things.pdf' with two pages:
        - page 1 contains word 'cat'
        - page 2 contains word 'fish'
    Initially if user searches either 'cat' or 'fish' document
    'living-things.pdf' will be returned by search.

    This scenario tests that after user extracts one page with help
    of 'pages_move_to_folder' REST API, documents will
    still be searchable. After extraction, there will be two documents,
    with one page each; at this point each if user searches 'cat' one document
    will be found and if user searches 'fish' another document will
    be revealed.
    """

    @patch('papermerge.core.signals.ocr_document_task')
    def setUp(self, _, _x):
        super().setUp()
        self.user = User.objects.create_user(username="user")
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)
        self.resources = Path(TEST_DIR_ABS_PATH) / 'resources'
        self.media = Path(TEST_DIR_ABS_PATH) / 'media'
        shutil.rmtree(self.media / 'docs', ignore_errors=True)
        shutil.rmtree(self.media / 'sidecars', ignore_errors=True)
        doc = Document.objects.create_document(
            title='living-things.pdf',
            lang='deu',
            user_id=self.user.pk,
            parent=self.user.home_folder,
        )
        payload = open(self.resources / 'living-things.pdf', 'rb')
        doc.upload(
            payload=payload,
            file_path=self.resources / 'living-things.pdf',
            file_name='living-things.pdf'
        )
        self.doc_version = doc.versions.last()
        self.doc_version.update_text_field([
            io.StringIO('cat'),
            io.StringIO('fish')
        ])
        rebuild_index()

    def test_documents_are_searchable_after_move_to_folder_extraction(self):
        response = self.client.get(
            reverse('search'),
            {'q': 'fish'}
        )
        assert response.status_code == 200

        assert len(response.data) == 1
        assert 'fish' in response.data[0]['text']
        assert 'living-things.pdf' == response.data[0]['title']

        # 'fish' page will be extracted into separate document
        fish_page = self.doc_version.pages.all()[1]
        assert fish_page.text == 'fish'

        url = reverse('pages_move_to_folder')
        pages_data = {
            'pages': [fish_page.pk],
            'single_page': True,
            'dst': self.user.home_folder.pk
        }
        response = self.client.post(url, pages_data, format='json')
        assert response.status_code == 204

        # Now search again for 'fish'
        response = self.client.get(
            reverse('search'),
            {'q': 'fish'}
        )
        assert response.status_code == 200

        # there must be one result
        assert len(response.data) == 1
        assert 'fish' in response.data[0]['text']

        # Now search 'cat'
        response = self.client.get(
            reverse('search'),
            {'q': 'cat'}
        )
        assert response.status_code == 200

        # there must be one result as well
        assert len(response.data) == 1
        assert 'cat' in response.data[0]['text']


@pytest.mark.skip()
class SearchByTags(TestCase):
    def setUp(self):
        super().setUp()
        self.user = User.objects.create_user(username="user")
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)
        self.resources = Path(TEST_DIR_ABS_PATH) / 'resources'
        self.media = Path(TEST_DIR_ABS_PATH) / 'media'
        shutil.rmtree(self.media / 'docs', ignore_errors=True)
        shutil.rmtree(self.media / 'sidecars', ignore_errors=True)

    def test_search_folder_by_tag(self):
        """
        Very basic search of a folder with a single tag
        """
        folder1 = Folder.objects.create(
            title="folder1",
            user=self.user,
            parent=self.user.home_folder
        )
        folder1.tags.set(
            ['tag1'],
            tag_kwargs={"user": self.user}
        )

        # folder2 has no tags attached
        Folder.objects.create(
            title="folder2", user=self.user,
            parent=self.user.home_folder
        )

        rebuild_index()
        response = self.client.get(
            reverse('search'),
            {'tags': 'tag1'}
        )
        assert response.status_code == 200

        # there must be one result
        assert len(response.data) == 1
        assert 'folder1' in response.data[0]['title']

    def test_search_folder_by_multiple_tag_default_ALL(self):
        """
        Very basic search of a folder with two tags.
        By default search by tag will look for nodes with 'ALL'
        tags assigned.
        """
        fruits = Folder.objects.create(
            title="fruits",
            user=self.user,
            parent=self.user.home_folder
        )
        fruits.tags.set(
            ['apple', 'fruits'],
            tag_kwargs={"user": self.user}
        )

        # folder #2 has no tags attached
        Folder.objects.create(
            title="folder2", user=self.user,
            parent=self.user.home_folder
        )

        # folder #3 has no tags attached
        folder3 = Folder.objects.create(
            title="folder3", user=self.user,
            parent=self.user.home_folder
        )

        folder3.tags.set(
            ['apple'],
            tag_kwargs={"user": self.user}
        )
        rebuild_index()
        response = self.client.get(
            reverse('search'),
            {'tags': 'apple,fruits'}
        )
        assert response.status_code == 200

        # Only folder fruits has both tags attached
        assert len(response.data) == 1
        assert 'fruits' in response.data[0]['title']

    def test_search_folder_by_multiple_tag_explicit_ANY(self):
        """
        Search of a folder with any of the two tags.
        """
        fruits = Folder.objects.create(
            title="fruits",
            user=self.user,
            parent=self.user.home_folder
        )
        fruits.tags.set(
            ['apple', 'fruits'],
            tag_kwargs={"user": self.user}
        )

        # folder #2 has no tags attached
        Folder.objects.create(
            title="folder2", user=self.user,
            parent=self.user.home_folder
        )

        # folder #3 has no tags attached
        folder3 = Folder.objects.create(
            title="folder3", user=self.user,
            parent=self.user.home_folder
        )

        folder3.tags.set(
            ['apple'],
            tag_kwargs={"user": self.user}
        )
        rebuild_index()
        response = self.client.get(
            reverse('search'),
            {'tags': 'apple,fruits', 'tags_op': 'any'}
        )
        assert response.status_code == 200

        # Both folder 'fruits' and 'folder3' have 'apple' tag
        # assigned
        assert len(response.data) == 2
        expected_result = set(['fruits', 'folder3'])
        actual_result = set(result['title'] for result in response.data)
        assert expected_result == actual_result
