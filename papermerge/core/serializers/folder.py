from rest_framework_json_api import serializers
from rest_framework_json_api.relations import ResourceRelatedField

from papermerge.core.models import (
    Folder,
    BaseTreeNode
)


class FolderSerializer(serializers.ModelSerializer):

    parent = ResourceRelatedField(queryset=Folder.objects)
    children = ResourceRelatedField(
        read_only=True,
        many=True,
    )

    class Meta:
        model = Folder
        resource_name = 'folders'
        fields = (
            'id',
            'title',
            'parent',
            'children',
            'created_at',
            'updated_at'
        )

    def create(self, validated_data, **extra_kwargs):
        kwargs = {
            **validated_data,
            **extra_kwargs
        }
        return Folder.objects.create(**kwargs)
