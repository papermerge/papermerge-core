import shutil
import os
import json
from pathlib import Path

from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from django_elasticsearch_dsl.test import ESTestCase

from papermerge.core.models import User

MODELS_DIR_ABS_PATH = os.path.abspath(os.path.dirname(__file__))
TEST_DIR_ABS_PATH = os.path.dirname(
    os.path.dirname(MODELS_DIR_ABS_PATH)
)


class SearchViewVeryBasicTestCase(ESTestCase, TestCase):

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
