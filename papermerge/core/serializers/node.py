from rest_framework_json_api import serializers

from papermerge.core.models import BaseTreeNode
from papermerge.core.serializers import (
    FolderSerializer,
    DocumentSerializer
)


class NodeSerializer(serializers.PolymorphicModelSerializer):
    polymorphic_serializers = [
        FolderSerializer,
        DocumentSerializer
    ]

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
