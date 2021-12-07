from django.contrib.auth.models import Group

from papermerge.test import TestCase
from papermerge.core.serializers import NodeMoveSerializer


class TestNodeSerializer(TestCase):

    def test_basic_node_move_serialization(self):

        serializer = NodeMoveSerializer(data={
            'parent': {
                'id': 100
            },
            'nodes': [
                {'id': 1}, {'id': 2}
            ]
        })

        self.assertTrue(serializer.is_valid())

    def test_node_move_requires_parent(self):
        """
        `parent` is required field
        """
        serializer = NodeMoveSerializer(data={
            # parent is missing here
            'nodes': [
                {'id': 1}, {'id': 2}
            ]
        })

        # parent field is missing
        self.assertFalse(serializer.is_valid())

    def test_node_move_requires_nodes(self):
        """
        `nodes` is required field
        """
        serializer = NodeMoveSerializer(data={
            'parent': {'id': 1}
            # nodes field is missing here
        })

        # nodes field is missing
        self.assertFalse(serializer.is_valid())
