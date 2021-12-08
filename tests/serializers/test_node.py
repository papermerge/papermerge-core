from papermerge.test import TestCase
from papermerge.core.serializers import NodeMoveSerializer


class TestNodeSerializer(TestCase):

    def test_basic_node_move_serialization(self):

        serializer = NodeMoveSerializer(data={
            'source_parent': {
                'id': 100
            },
            'target_parent': {
                'id': 102
            },

            'nodes': [
                {'id': 1}, {'id': 2}
            ]
        })

        self.assertTrue(serializer.is_valid())

    def test_node_move_requires_source_parent(self):
        """
        `source_parent` is required field
        """
        serializer = NodeMoveSerializer(data={
            # source_parent is missing here
            'target_parent': {
                'id': 102
            },
            'nodes': [
                {'id': 1}, {'id': 2}
            ]
        })

        # source parent field is missing
        self.assertFalse(serializer.is_valid())

    def test_node_move_requires_target_parent(self):
        """
        `target_parent` is required field
        """
        serializer = NodeMoveSerializer(data={
            # target_parent is missing here
            'source_parent': {
                'id': 102
            },
            'nodes': [
                {'id': 1}, {'id': 2}
            ]
        })

        # target parent field is missing
        self.assertFalse(serializer.is_valid())

    def test_node_move_requires_nodes(self):
        """
        `nodes` is required field
        """
        serializer = NodeMoveSerializer(data={
            'source_parent': {'id': 1},
            'target_parent': {'id': 1}
            # nodes field is missing here
        })

        # nodes field is missing
        self.assertFalse(serializer.is_valid())
