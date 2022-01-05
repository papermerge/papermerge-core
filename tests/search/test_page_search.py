import io
from django.test import TestCase

from papermerge.core.models import (User, Document)
from papermerge.search.documents import Page


class TestPageSearch(TestCase):

    def setUp(self):
        self.user = User.objects.create_user(username="user1")
        self.doc = Document.objects.create_document(
            title="invoice.pdf",
            lang="deu",
            user_id=self.user.pk,
            parent=self.user.home_folder
        )
        self.doc_version = self.doc.versions.last()

    def test_page_search(self):
        self.doc_version.create_pages(page_count=3)
        self.doc_version.update_text_field([
            io.StringIO('One'),
            io.StringIO('Two'),
            io.StringIO('Three')
        ])

        result = Page.search().query('term', text='one')
        self.assertEqual(len(list(result)), 1)
