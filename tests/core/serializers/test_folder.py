import pytest

from papermerge.core.models import User, Folder
from papermerge.core.serializers import FolderSerializer

from papermerge.test import TestCase
from papermerge.test.baker_recipes import folder_recipe, user_recipe


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
    user = user_recipe.make()
    my_documents = folder_recipe.make(
        title="My Documents",
        parent=user.home_folder
    )
    sub1 = folder_recipe.make(
        title="My Invoices",
        user=user,
        parent=my_documents
    )
    lidl_folder = folder_recipe.make(
        title="Lidl",
        user=user,
        parent=sub1
    )

    ser = FolderSerializer(lidl_folder)

    actual_breadcrumb_titles = set([
        item[0] for item in ser.data['breadcrumb']
    ])

    expected_breadcrumb_titles = {
        '.home', 'My Documents', 'My Invoices', 'Lidl'
    }

    assert actual_breadcrumb_titles == expected_breadcrumb_titles
