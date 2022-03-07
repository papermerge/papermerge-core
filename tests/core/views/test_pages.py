import io
import json
from unittest.mock import patch

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

    @patch('papermerge.core.views.pages.remove_pdf_pages')
    @patch('papermerge.core.views.pages.reuse_ocr_data_after_delete')
    def test_page_delete(
            self,
            reuse_ocr_data_mock,
            remove_pdf_pages_mock
    ):  # noqa
        """
        DELETE /pages/{id}/
        """
        doc = self.doc_version.document
        self.doc_version.create_pages(page_count=5)
        pages = self.doc_version.pages.all()
        fourth_page = pages.all()[3]

        for page in pages:
            page.update_text_field(io.StringIO(f'Hello Page {page.number}!'))

        # at this point document has only one version
        assert doc.versions.count() == 1
        # last version has 5 pages
        assert doc.versions.last().pages.count() == 5

        response = self.client.delete(
            reverse('pages_page', args=(fourth_page.pk,)),
        )
        assert response.status_code == 204

        # at this point document has two verions
        assert doc.versions.count() == 2
        # last version has 4 pages
        assert doc.versions.last().pages.count() == 4

    @patch('papermerge.core.views.pages.remove_pdf_pages')
    @patch('papermerge.core.views.pages.reuse_ocr_data_after_delete')
    def test_pages_delete(
            self,
            reuse_ocr_data_mock,
            remove_pdf_pages_mock
    ):  # noqa
        """
        DELETE /pages/
        Content-Type: application/json
        {
            "pages": [1, 2, 3]
        }
        """
        doc = self.doc_version.document
        self.doc_version.create_pages(page_count=5)
        pages = self.doc_version.pages.all()
        page_ids = [page.pk for page in pages]

        for page in pages:
            page.update_text_field(io.StringIO(f'Hello Page {page.number}!'))

        # at this point document has only one version
        assert doc.versions.count() == 1
        # last version has 5 pages
        assert doc.versions.last().pages.count() == 5

        response = self.client.delete(
            reverse('pages'),
            data={
                "pages": page_ids[-2:]  # delete last two pages
            },
            format='json'
        )
        assert response.status_code == 204

        # at this point document has two versions
        assert doc.versions.count() == 2
        # last version has 3 pages
        assert doc.versions.last().pages.count() == 3

    @patch('papermerge.core.views.pages.reorder_pdf_pages')
    @patch('papermerge.core.views.pages.reuse_ocr_data_after_reorder')
    def test_pages_reorder(
            self,
            reuse_ocr_data_mock,
            reorder_pdf_pages_mock
    ):
        self.doc_version.document
        self.doc_version.create_pages(page_count=3)
        pages = self.doc_version.pages.all()
        pages_data = [
            {
                'id': pages[0].id,
                'old_number': pages[0].number,  # = 1
                'new_number': 3
            }, {
                'id': pages[1].id,
                'old_number': pages[1].number,  # = 2
                'new_number': 2
            }, {
                'id': pages[2].id,
                'old_number': pages[2].number,  # = 3
                'new_number': 1
            },
        ]

        response = self.client.post(
            reverse('pages_reorder'),
            data={
                "pages": pages_data  # reoder pages
            },
            format='json'
        )

        assert response.status_code == 204

    @patch('papermerge.core.views.pages.rotate_pdf_pages')
    def test_pages_rotate(
            self,
            rotate_pdf_pages_mock
    ):
        self.doc_version.document
        self.doc_version.create_pages(page_count=3)
        pages = self.doc_version.pages.all()
        pages_data = [
            {
                'id': pages[0].id,
                'number': pages[0].number,  # = 1
                'angle': 90
            }
        ]

        response = self.client.post(
            reverse('pages_rotate'),
            data={
                "pages": pages_data  # rotate pages
            },
            format='json'
        )

        assert response.status_code == 204
