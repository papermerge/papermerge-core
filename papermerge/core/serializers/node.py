from rest_framework.serializers import Serializer
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


ONLY_ORIGINAL = 'only_original'
ONLY_LAST = 'only_last'
ZIP = 'zip'
TARGZ = 'targz'


class NodeSerializer(serializers.PolymorphicModelSerializer):
    polymorphic_serializers = [
        FolderSerializer,
        DocumentSerializer
    ]

    parent = ResourceRelatedField(queryset=Folder.objects)

    @classmethod
    def get_polymorphic_serializer_for_instance(cls, instance):
        if instance.is_document:
            return DocumentSerializer

        return FolderSerializer

    def to_representation(self, instance):
        """
        Retrieve the appropriate polymorphic serializer and use this to
        handle representation.
        """
        serializer_class = self.get_polymorphic_serializer_for_instance(
            instance
        )
        inst = instance.document_or_folder
        ret = serializer_class(inst, context=self.context).to_representation(
            inst
        )
        return ret

    class Meta:
        model = BaseTreeNode
        resource_name = 'nodes'
        fields = (
            'title',
            'parent',
            'created_at',
            'updated_at',
        )


class Data_NodeSerializer(Serializer):
    data = NodeSerializer()


class NodeIDSerializer(rest_serializers.Serializer):
    id = rest_serializers.UUIDField()


class NodeMoveSerializer(rest_serializers.Serializer):
    # new parent i.e. target folder
    target_parent = NodeIDSerializer(required=True)
    # nodes to move under the new parent
    nodes = NodeIDSerializer(many=True)


class NodesDownloadSerializer(rest_serializers.Serializer):
    # list of nodes to download
    node_ids = rest_serializers.ListField(
        child=rest_serializers.UUIDField()
    )
    file_name = rest_serializers.CharField(
        max_length=32,
        required=False
    )
    # What to include in downloaded file?
    include_version = rest_serializers.ChoiceField(
        choices=(
            (ONLY_ORIGINAL, 'Only original'),
            (ONLY_LAST, 'Only last'),
        ),
        default=ONLY_LAST
    )
    archive_type = rest_serializers.ChoiceField(
        choices=(
            (TARGZ, '.tar.gz'),
            (ZIP, '.zip')
        ),
        default=ZIP
    )


class InboxCountSerializer(rest_serializers.Serializer):
    count = rest_serializers.IntegerField()


class NodeTagsSerializer(rest_serializers.Serializer):
    # list of tag names
    tags = rest_serializers.ListField(
        child=rest_serializers.CharField()
    )
