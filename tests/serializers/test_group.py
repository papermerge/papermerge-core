from django.contrib.auth.models import Group

from papermerge.test import TestCase
from papermerge.core.serializers import GroupSerializer


class TestTasks(TestCase):

    def test_basic_serialization(self):
        serializer = GroupSerializer(data={'name': 'group_x1'})

        self.assertTrue(serializer.is_valid())

        self.assertEqual(Group.objects.count(), 0)
        serializer.save()
        self.assertEqual(Group.objects.count(), 1)

        self.assertEqual('group_x1', serializer.data['name'])
        self.assertIsNotNone(serializer.data['id'])
