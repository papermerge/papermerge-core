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
    # Original nodes parent
    source_parent = NodeIDSerializer(required=True)
    # new parent i.e. target folder
    target_parent = NodeIDSerializer(required=True)
    # nodes to move under the new parent
    nodes = NodeIDSerializer(many=True)


class NodesDownloadSerializer(rest_serializers.Serializer):
    # list of nodes to download
    nodes = NodeIDSerializer(many=True)
    file_name = rest_serializers.CharField(
        max_length=32,
        required=False
    )
    # What to include in downloaded file?
    include_version = rest_serializers.ChoiceField(
        choices=(
            ('all', 'All'),
            ('only_original', 'Only original'),
            ('only_last', 'Only last'),
            ('only_original_and_last', 'Only original and last')
        ),
        default='only_last'
    )
    archive_type = rest_serializers.ChoiceField(
        choices=(
            ('targz', '.tar.gz'),
            ('zip', '.zip')
        ),
        default='zip'
    )
