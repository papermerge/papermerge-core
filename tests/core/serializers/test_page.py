from papermerge.test import TestCase

from model_bakery import baker

from papermerge.core.serializers import PageSerializer


class TestPageSerializer(TestCase):

    def test_basic_serialization(self):
        page = baker.make('page')

        serializer = PageSerializer(page)

        assert str(page.pk) in serializer.data['svg_url']
        assert str(page.pk) in serializer.data['jpg_url']

        assert set(serializer.data.keys()) == {
            'id', 'document_version', 'lang', 'number', 'text',
            'svg_url', 'jpg_url'
        }
