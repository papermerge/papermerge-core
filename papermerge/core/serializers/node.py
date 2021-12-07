from rest_framework_json_api import serializers
from rest_framework_json_api.relations import ResourceRelatedField
from rest_framework import serializers as rest_serializers

from papermerge.core.models import (
    BaseTreeNode,
    Folder
)
from papermerge.core.serializers import (
    FolderSerializer,
    DocumentSerializer
)


class NodeSerializer(serializers.PolymorphicModelSerializer):
    polymorphic_serializers = [
        FolderSerializer,
        DocumentSerializer
    ]

    parent = ResourceRelatedField(queryset=Folder.objects)

    class Meta:
        model = BaseTreeNode
        resource_name = 'nodes'
        fields = (
            'id',
            'title',
            'parent',
            'created_at',
            'updated_at',
        )


class NodeIDSerializer(rest_serializers.Serializer):
    id = rest_serializers.CharField(max_length=32)


class NodeMoveSerializer(rest_serializers.Serializer):
    # new parent i.e. target folder
    parent = NodeIDSerializer(required=True)
    # nodes to move under the new parent
    nodes = NodeIDSerializer(many=True)
