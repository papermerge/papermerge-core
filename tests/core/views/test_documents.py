import json
import os
import shutil
from pathlib import Path
from unittest.mock import patch

import pytest
from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient

from papermerge.core.models import Document, User
from papermerge.test import TestCase as PapermergeTestCase
from papermerge.test import maker

MODELS_DIR_ABS_PATH = os.path.abspath(os.path.dirname(__file__))
TEST_DIR_ABS_PATH = os.path.dirname(
    os.path.dirname(MODELS_DIR_ABS_PATH)
)


@pytest.mark.skip()
class DocumentUploadViewTestCase(TestCase):

    def setUp(self):
        self.user = User.objects.create_user(username="user1")
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)
        self.resources = Path(TEST_DIR_ABS_PATH) / 'resources'
        self.media = Path(TEST_DIR_ABS_PATH) / 'media'
        shutil.rmtree(self.media / 'docs', ignore_errors=True)
        shutil.rmtree(self.media / 'sidecars', ignore_errors=True)

    @patch('papermerge.core.signals.ocr_document_task')
    def test_document_upload_view(self, _x):
        doc = Document.objects.create_document(
            title="three-pages.pdf",
            lang="deu",
            user_id=self.user.pk,
            parent=self.user.home_folder
        )

        file = open(self.resources / 'three-pages.pdf', 'rb')
        payload = {"file": file}
        url = reverse('documents_upload', kwargs={
            'document_id': doc.pk,
            'file_name': 'three-pages.pdf'
        })
        # Don't start OCR
        self.user.preferences['ocr__trigger'] = 'manual'
        self.user.preferences

        last_version = doc.versions.last()
        assert last_version.size == 0
        assert last_version.pages.count() == 0
        response = self.client.put(
            url,
            payload,
            format='multipart',
            HTTP_CONTENT_DISPOSITION="attachment; filename=three-pages.pdf"
        )

        assert response.status_code == 201
        last_version = doc.versions.last()
        assert last_version.size > 0
        assert last_version.file_name == 'three-pages.pdf'
        assert last_version.pages.count() == 3

        file.close()


@pytest.mark.skip()
class DocumentViewTest(TestCase):

    def setUp(self):
        self.user = User.objects.create_user(username="user1")
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)
        self.resources = Path(TEST_DIR_ABS_PATH) / 'resources'
        self.media = Path(TEST_DIR_ABS_PATH) / 'media'
        self.doc = Document.objects.create_document(
            title="three-pages.pdf",
            lang="deu",
            user_id=self.user.pk,
            parent=self.user.home_folder
        )

        shutil.rmtree(self.media / 'docs', ignore_errors=True)
        shutil.rmtree(self.media / 'sidecars', ignore_errors=True)

    def test_get_document_as_application_vnd_api_json(self):
        url = reverse('document-detail', args=(self.doc.pk,))
        response = self.client.get(url, HTTP_ACCEPT='application/vnd.api+json')

        assert response.status_code == 200
        assert response.accepted_media_type == 'application/vnd.api+json'
        assert response.data['id'] == str(self.doc.pk)
        assert response.data['title'] == 'three-pages.pdf'

    def test_rename_document(self):
        url = reverse('document-detail', args=(self.doc.pk,))
        body = {
            'data': {
                'type': 'documents',
                'id': str(self.doc.pk),
                'attributes': {
                    'title': 'new-title.pdf'
                }
            }
        }
        response = self.client.patch(
            url,
            data=json.dumps(body),
            content_type='application/vnd.api+json'
        )

        assert response.status_code == 200
        assert response.data['title'] == 'new-title.pdf'


@pytest.mark.skip()
class DocumentOcrTextViewTest(PapermergeTestCase):

    @patch('papermerge.core.signals.ocr_document_task')
    def test_basic_get_document_ocr_text(self, _):
        """
        Retrieve OCRed text from all pages of given document's latest version
        """
        doc = maker.document(
            "s3.pdf",
            user=self.user,
        )
        doc_ver = doc.versions.last()
        doc_ver.text = "S1 S2 S3"
        doc_ver.save()

        url = reverse('document-ocr-text', args=(str(doc.pk),))
        response = self.client.get(url)

        assert response.status_code == 200

        assert response.data['text'] == 'S1 S2 S3'

    @patch('papermerge.core.signals.ocr_document_task')
    def test_get_document_ocr_text_of_pages_2_and_3(self, _x):
        """
        Retrieve OCRed text from given pages of given document's latest version

        User requests OCRed text of pages 2 and 3
        """
        doc = maker.document(
            "s3.pdf",
            user=self.user,
        )
        doc_ver = doc.versions.last()
        doc_ver.text = "S1 S2 S3"
        doc_ver.save()
        page_2 = doc_ver.pages.all()[1]
        page_3 = doc_ver.pages.all()[2]
        page_2.text = "S2"
        page_2.save()
        page_3.text = "S3"
        page_3.save()

        url = reverse('document-ocr-text', args=(str(doc.pk),))
        response = self.client.get(
            url,
            {'page_numbers[]': [2, 3]}
        )

        assert response.status_code == 200

        assert response.data['text'] == 'S2 S3'

    @patch('papermerge.core.signals.ocr_document_task')
    def test_get_document_ocr_text_of_page_1(self, _x):
        """
        Retrieve OCRed text from given pages of given document's latest version

        User requests OCRed text of the first page
        """
        doc = maker.document(
            "s3.pdf",
            user=self.user,
        )
        doc_ver = doc.versions.last()
        doc_ver.text = "S1 S2 S3"
        doc_ver.save()
        page_1 = doc_ver.pages.all()[0]
        page_1.text = "S1"
        page_1.save()

        url = reverse('document-ocr-text', args=(str(doc.pk),))
        response = self.client.get(
            url,
            {'page_numbers[]': [1]}
        )

        assert response.status_code == 200

        assert response.data['text'] == 'S1'

    @patch('papermerge.core.signals.ocr_document_task')
    def test_get_document_junk_input(self, _x):
        """
        Make sure there are no exception on junk input
        """
        doc = maker.document(
            "s3.pdf",
            user=self.user,
        )
        doc_ver = doc.versions.last()
        doc_ver.text = "S1 S2 S3"
        doc_ver.save()
        for page in doc_ver.pages.all():
            page = doc_ver.pages.all()[page.number - 1]
            page.text = f"S{page.number}"
            page.save()

        url = reverse('document-ocr-text', args=(str(doc.pk),))
        response = self.client.get(
            url,
            {'page_numbers[]': ['I-am-not-an-integer']}
        )

        assert response.status_code == 200

        assert response.data['text'] == 'S1 S2 S3'

    @patch('papermerge.core.signals.ocr_document_task')
    def test_get_document_ocr_text_filter_by_page_ids(self, _x):
        """
        Retrieve OCRed text from given pages of given document's latest version

        User requests OCRed text of given page specified by page id.
        """
        doc = maker.document(
            "s3.pdf",
            user=self.user,
        )
        doc_ver = doc.versions.last()
        doc_ver.text = "S1 S2 S3"
        doc_ver.save()
        page_1 = doc_ver.pages.all()[0]
        page_1.text = "S1"
        page_1.save()

        url = reverse('document-ocr-text', args=(str(doc.pk),))
        response = self.client.get(
            url,
            # filter by page id
            {'page_ids[]': [str(page_1.pk)]}
        )

        assert response.status_code == 200

        assert response.data['text'] == 'S1'
