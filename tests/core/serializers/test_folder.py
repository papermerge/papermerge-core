from papermerge.test import TestCase
from papermerge.core.models import User, Folder
from papermerge.core.serializers import FolderSerializer


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
