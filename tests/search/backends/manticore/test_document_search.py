import io
from django.test import TestCase

from papermerge.search.models import DocumentIndex
from model_bakery import baker


class TestDocumentSearch(TestCase):

    def setUp(self):
        self.user = baker.make('core.user')
        self.doc = baker.make(
            'core.document',
            user_id=self.user.id,
            parent=self.user.home_folder
        )
        self.doc_version = self.doc.versions.last()

    def test_basic_document_search(self):
        streams = [
            io.StringIO('One'),
            io.StringIO('Two'),
            io.StringIO('Three')
        ]
        self.doc_version.create_pages(
            page_count=len(streams)
        )
        self.doc_version.update_text_field(streams)

        result = DocumentIndex.search.query(
            user_id=self.user.id,
            text='One'
        )
        result_list = list(result)

        assert len(result_list) == 1
        assert result_list[0].title == self.doc.title
