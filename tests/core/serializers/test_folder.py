import pytest

from papermerge.core.models import User, Folder
from papermerge.core.serializers import FolderSerializer

from papermerge.test import TestCase
from papermerge.test.baker_recipes import make_folders


class TestFolderSerializer(TestCase):

    def setUp(self):
        self.user = User.objects.create(username='user1')

    def test_basic_folder_serialization(self):
        data = {
            'title': 'My Documents',
            'type': 'folders',
            'parent': {
                'type': 'folders',
                'id': self.user.home_folder.pk
            }
        }
        serializer = FolderSerializer(data=data)

        self.assertTrue(serializer.is_valid(), serializer.errors)

        serializer.save(user_id=self.user.pk)

        self.assertEqual('My Documents', serializer.data['title'])

        self.assertIsNotNone(serializer.data)
        self.assertIsNotNone(serializer.data['id'])

    def test_basic_folder_serialization_from_instance(self):
        folder = Folder.objects.create(
            title='My Documents',
            user=self.user
        )
        folder.tags.set(
            ['invoice', 'important'],
            tag_kwargs={"user": self.user}
        )
        serializer = FolderSerializer(instance=folder)

        assert serializer.data
        assert serializer.data['id']
        assert len(serializer.data['tags']) == 2


@pytest.mark.django_db
def test_folder_serializer_for_correct_breadcrumb():
    lidl_folder = make_folders(".home/My Documents/My Invoices/Lidl")

    ser = FolderSerializer(lidl_folder)

    # breadcrumb returns a list of tuples (title, id)
    # where ``id`` is the id of the node from the breadcrumb
    # and ``title`` is the title of the node from the breadcrumb
    # The most distanced ancestor is returned first
    # i.e .home (or .inbox) title will be first in the list
    actual_breadcrumb_titles = set([
        item[0] for item in ser.data['breadcrumb']
    ])

    expected_breadcrumb_titles = {
        '.home', 'My Documents', 'My Invoices', 'Lidl'
    }

    assert actual_breadcrumb_titles == expected_breadcrumb_titles
