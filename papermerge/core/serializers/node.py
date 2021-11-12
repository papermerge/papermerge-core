from rest_framework_json_api import serializers
from rest_framework_json_api.relations import ResourceRelatedField


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
            'children',
            'created_at',
            'updated_at',
        )
