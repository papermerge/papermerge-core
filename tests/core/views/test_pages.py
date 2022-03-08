import shutil
import os
import io
import json
from pathlib import Path

import pikepdf
from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient

from papermerge.core.models import User, Document
from papermerge.core.storage import abs

MODELS_DIR_ABS_PATH = os.path.abspath(os.path.dirname(__file__))
TEST_DIR_ABS_PATH = os.path.dirname(
    os.path.dirname(MODELS_DIR_ABS_PATH)
)


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
        self.resources = Path(TEST_DIR_ABS_PATH) / 'resources'
        self.media = Path(TEST_DIR_ABS_PATH) / 'media'
        shutil.rmtree(self.media / 'docs', ignore_errors=True)
        shutil.rmtree(self.media / 'sidecars', ignore_errors=True)

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

    def test_page_delete(self):
        """
        DELETE /pages/{id}/
        """
        payload = open(self.resources / 'three-pages.pdf', 'rb')
        doc = self.doc
        doc.upload(
            payload=payload,
            file_path=self.resources / 'three-pages.pdf',
            file_name='three-pages.pdf'
        )
        pages = self.doc_version.pages.all()
        third_page = pages.all()[2]

        for page in pages:
            page.update_text_field(io.StringIO(f'Hello Page {page.number}!'))

        # at this point document has only one version
        assert doc.versions.count() == 1
        # last version has 3 pages
        last_version = doc.versions.last()
        assert last_version.pages.count() == 3
        pdf_file = pikepdf.Pdf.open(abs(last_version.document_path))
        assert len(pdf_file.pages) == 3

        # delete last (i.e. 3rd) page
        response = self.client.delete(
            reverse('pages_page', args=(third_page.pk,)),
        )
        assert response.status_code == 204

        # at this point document has two versions
        assert doc.versions.count() == 2
        # last version has 2 pages
        last_version = doc.versions.last()
        assert last_version.pages.count() == 2
        pdf_file = pikepdf.Pdf.open(abs(last_version.document_path))
        assert len(pdf_file.pages) == 2
        pdf_file.close()

    def test_pages_delete(self):
        """
        DELETE /pages/
        Content-Type: application/json
        {
            "pages": [1, 2, 3]
        }
        """
        payload = open(self.resources / 'three-pages.pdf', 'rb')
        doc = self.doc_version.document
        doc.upload(
            payload=payload,
            file_path=self.resources / 'three-pages.pdf',
            file_name='three-pages.pdf'
        )
        pages = self.doc_version.pages.all()
        page_ids = [page.pk for page in pages]

        for page in pages:
            page.update_text_field(io.StringIO(f'Hello Page {page.number}!'))

        # at this point document has only one version
        assert doc.versions.count() == 1
        # last version has 3 pages
        last_version = doc.versions.last()
        assert last_version.pages.count() == 3

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
        # last version has only one page left
        last_version = doc.versions.last()
        assert last_version.pages.count() == 1
        pdf_file = pikepdf.Pdf.open(abs(last_version.document_path))
        assert len(pdf_file.pages) == 1
        pdf_file.close()

    def test_pages_reorder(self):
        payload = open(self.resources / 'three-pages.pdf', 'rb')
        doc = self.doc
        doc.upload(
            payload=payload,
            file_path=self.resources / 'three-pages.pdf',
            file_name='three-pages.pdf'
        )
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
                "pages": pages_data  # reorder pages
            },
            format='json'
        )

        assert response.status_code == 204

    def test_pages_rotate(self):
        payload = open(self.resources / 'three-pages.pdf', 'rb')
        doc = self.doc
        doc.upload(
            payload=payload,
            file_path=self.resources / 'three-pages.pdf',
            file_name='three-pages.pdf'
        )
        pages = self.doc_version.pages.all()
        pages_data = [
            {
                'id': pages[0].id,
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
