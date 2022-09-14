from django.test import TestCase
from django.urls import reverse

from rest_framework.test import APIClient

from model_bakery import baker

from papermerge.test import maker


class DownloadDocumentVersionAnonymousAccess(TestCase):

    def setUp(self):
        self.client = APIClient()

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


class DownloadDocumentVersionOnlyOwner(TestCase):
    """
    Asserts that only owner can download document versions
    """

    def setUp(self):
        self.owner = baker.make('core.User')
        self.john = baker.make('core.User')
        self.client_owner = APIClient()
        self.client_owner.force_authenticate(user=self.owner)
        self.client_john = APIClient()
        self.client_john.force_authenticate(user=self.john)

    def test_only_owner_can_download_document_version(self):
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
