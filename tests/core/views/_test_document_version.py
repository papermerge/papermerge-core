from unittest.mock import patch

import pytest
from django.test import TestCase
from django.urls import reverse
from model_bakery import baker

from papermerge.core.storage import abs_path
from papermerge.test import maker


@pytest.mark.skip()
class DownloadDocumentVersionAnonymousAccess(TestCase):
    def test_anonymouse_user_cannot_access_download_document_version(self):
        """
        Assert that anonymous user does not have access
        to ``/api/document-version/uuid:pk/download`` endpoint
        """
        pages = baker.prepare("core.Page", _quantity=2)
        doc_ver = baker.make("core.DocumentVersion", pages=pages)
        url = reverse('download-document-version', args=(doc_ver.pk,))

        response = self.client.get(url)

        assert response.status_code == 401


@pytest.mark.skip()
class DownloadDocumentVersionOnlyOwner(TestCase):
    """
    Asserts that only owner can download document versions
    """

    def setUp(self):
        self.owner = baker.make('core.User')
        self.john = baker.make('core.User')
        self.client_owner.force_authenticate(user=self.owner)
        self.client_john.force_authenticate(user=self.john)

    @patch('papermerge.core.signals.ocr_document_task')
    def test_only_owner_can_download_document_version(self, _1):
        """
        Assert that if user is not the owner of the document he/she won't
        be able to download document versions
        """
        doc = maker.document(
            "s3.pdf",
            user=self.owner
        )
        doc_ver = doc.versions.last()
        url = reverse('download-document-version', args=(doc_ver.pk,))

        # owner tries to download document version
        response = self.client_owner.get(url)
        assert response.status_code == 200

        # Authenticated, but non-owner user tries to download document version
        response = self.client_john.get(url)
        assert response.status_code == 403

    @patch('papermerge.core.signals.ocr_document_task')
    def test_download_document_version(self, _1):
        """Asserts that document version download works"""
        doc = maker.document(
            "s3.pdf",
            user=self.owner
        )
        doc_ver = doc.versions.last()
        url = reverse('download-document-version', args=(doc_ver.pk,))

        # owner tries to download document version
        response = self.client_owner.get(url)
        assert response.status_code == 200

        with open(abs_path(doc_ver.document_path.path), 'rb') as file:
            expected_content = file.read()
            # entire document was downloaded
            assert len(response.content) == len(expected_content)
