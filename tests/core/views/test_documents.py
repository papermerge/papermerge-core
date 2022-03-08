import os
import shutil
from pathlib import Path

from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient

from papermerge.core.models import User, Document

MODELS_DIR_ABS_PATH = os.path.abspath(os.path.dirname(__file__))
TEST_DIR_ABS_PATH = os.path.dirname(
    os.path.dirname(MODELS_DIR_ABS_PATH)
)


class DocumentUploadViewTestCase(TestCase):

    def setUp(self):
        self.user = User.objects.create_user(username="user1")
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)
        self.resources = Path(TEST_DIR_ABS_PATH) / 'resources'
        self.media = Path(TEST_DIR_ABS_PATH) / 'media'
        shutil.rmtree(self.media / 'docs', ignore_errors=True)
        shutil.rmtree(self.media / 'sidecars', ignore_errors=True)

    def test_document_upload_view(self):
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
