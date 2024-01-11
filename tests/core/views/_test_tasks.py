import json
from unittest.mock import patch

import pytest
from django.test import TestCase
from django.urls import reverse

from papermerge.core.models import Document, User


@pytest.mark.skip()
class TasksViewTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="user1")
        self.client.force_authenticate(user=self.user)

    @patch('papermerge.core.views.tasks.ocr_document_task')
    def test_run_ocr(self, mocked_ocr_document_task):
        url = reverse('tasks-ocr')
        doc = Document.objects.create(
            title='doc.pdf',
            user=self.user,
            parent=self.user.home_folder
        )

        data = {
            'lang': 'deu',
            'doc_id': str(doc.id)
        }
        response = self.client.post(
            url,
            data=json.dumps(data),
            content_type='application/json'
        )

        assert response.status_code == 200, response.data
