import io
import json

from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient

from papermerge.core.models import User, Document


class PageViewTestCase(TestCase):

    def setUp(self):
        self.user = User.objects.create_user(username="user1")
        self.doc = Document.objects.create_document(
            title="invoice.pdf",
            lang="deu",
            user_id=self.user.pk,
            parent=self.user.home_folder
        )
        self.doc_version = self.doc.versions.last()
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

    def test_page_view_in_json_format(self):
        """
        GET /pages/{id}/
        Accept: application/vnd.api+json
        """
        self.doc_version.create_pages(page_count=1)
        page = self.doc_version.pages.first()

        page.update_text_field(io.StringIO('Hello Page!'))
        response = self.client.get(
            reverse('pages_page', args=(page.pk,)),
            HTTP_ACCEPT='application/vnd.api+json'
        )

        assert response.status_code == 200

        json_data = json.loads(response.content)
        assert json_data['data']['id'] == '1'
        assert json_data['data']['attributes'] == {
            'lang': 'deu',
            'number': 1,
            'text': 'Hello Page!'
        }

    def test_page_view_in_text_format(self):
        """
        GET /pages/{id}/
        Accept: text/plain
        """
        self.doc_version.create_pages(page_count=1)
        page = self.doc_version.pages.first()

        page.update_text_field(io.StringIO('Hello Page!'))
        response = self.client.get(
            reverse('pages_page', args=(page.pk,)),
            HTTP_ACCEPT='text/plain'
        )

        assert response.status_code == 200
        assert response.content.decode('utf-8') == 'Hello Page!'
