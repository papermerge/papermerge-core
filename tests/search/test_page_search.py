import io
from django.test import TestCase
from django_elasticsearch_dsl.test import ESTestCase

from papermerge.core.models import (User, Document)
from papermerge.search.documents import PageIndex
from papermerge.search.serializers import SearchResultSerializer


def create_document(title, streams):
    """
    Creates a document

    Arguments:
        `title` - str - document's title
        `streams` - list - a list of io.StringIO strings which
            will be document pages content. Document's page
            count will be equal to the len(streams)
    """
    user, created = User.objects.get_or_create(username="user1")
    doc = Document.objects.create_document(
        title=title,
        lang="deu",
        user_id=user.pk,
        parent=user.home_folder
    )
    doc_version = doc.versions.last()

    doc_version.create_pages(page_count=len(streams))
    doc_version.update_text_field(streams)

    return doc, doc_version, user


class TestPageSearch(ESTestCase, TestCase):

    def test_basic_page_search(self):
        """Very basic assertion of search feature"""

        create_document(
            title="invoice.pdf",
            streams=[
                io.StringIO('One'),
                io.StringIO('Two'),
                io.StringIO('Three')
            ]
        )
        create_document(
            title="colors.pdf",
            streams=[
                io.StringIO('blue'),
                io.StringIO('red'),
            ]
        )

        result = PageIndex.search().query('term', text='one')
        result_list = list(result)

        self.assertEqual(len(result_list), 1)
        self.assertEqual(result_list[0].title, "invoice.pdf")

    def test_search_result_serializer(self):
        """Very basic check of search result serializer"""

        create_document(
            title="invoice.pdf",
            streams=[
                io.StringIO('One'),
                io.StringIO('Two'),
                io.StringIO('Three')
            ]
        )
        create_document(
            title="colors.pdf",
            streams=[
                io.StringIO('red'),
                io.StringIO('some blue color here'),
            ]
        )

        result = PageIndex.search().query('term', text='blue')
        result_list = list(result)

        serializer = SearchResultSerializer(result_list, many=True)
        titles = [page['title'] for page in serializer.data]

        self.assertEqual(
            ['colors.pdf'], titles
        )
