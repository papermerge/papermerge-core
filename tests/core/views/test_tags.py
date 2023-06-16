import json

import pytest
from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient

from papermerge.core.models import Tag, User


@pytest.mark.skip()
class TagsViewTestCase(TestCase):

    def setUp(self):
        self.user = User.objects.create_user(username="user1")
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

    def test_create_tag(self):
        """
        Tag is created and http status code 201 is returned
        """
        tag1 = {
            'data': {
                'type': 'tags',
                'attributes': {
                    'name': 'tag1',
                    'bg_color': '#ffaaff',
                    'fg_color': '#ff0000',
                    'description': 'blah',
                    'pinned': False
                }
            }
        }
        response = self.client.post(
            reverse('tag-list'),
            data=json.dumps(tag1),
            content_type='application/vnd.api+json'
        )
        assert response.status_code == 201, response.data
        assert Tag.objects.count() == 1

    def test_create_duplicate_tag_for_same_user(self):
        """
        Duplicate tags will return 400 validation error.

        The point is that (tag.name, user_id) pairs must be unique i.e.
        tag names are unique per user.
        """
        tag1 = {
            'data': {
                'type': 'tags',
                'attributes': {
                    'name': 'tag1',
                    'bg_color': '#ffaaff',
                    'fg_color': '#ff0000',
                    'description': 'blah',
                    'pinned': False
                }
            }
        }
        response = self.client.post(
            reverse('tag-list'),
            data=json.dumps(tag1),
            content_type='application/vnd.api+json'
        )
        assert response.status_code == 201, response.data
        assert Tag.objects.count() == 1

        response = self.client.post(
            reverse('tag-list'),
            data=json.dumps(tag1),
            content_type='application/vnd.api+json'
        )

        assert response.status_code == 400, response.data
        assert 'already exists' in response.data[0]['detail']
        assert Tag.objects.count() == 1
