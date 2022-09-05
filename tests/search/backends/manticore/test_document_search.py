from django.test import TestCase

from papermerge.search.models import DocumentIndex


class TestDocumentSearch(TestCase):

    def test_basic_document_search_api(self):
        result = DocumentIndex.search.query(
            user_id=self.user.id,
            text='One'
        )
        result_list = list(result)

        assert len(result_list) == 1
        assert result_list[0].title == self.doc.title
