from rest_framework_json_api import serializers
from rest_framework_json_api.relations import ResourceRelatedField

from papermerge.core.models import Folder


class FolderSerializer(serializers.ModelSerializer):

    parent = ResourceRelatedField(queryset=Folder.objects)

    class Meta:
        model = Folder
        resource_name = 'folders'
        fields = (
            'id',
            'title',
            'parent',
            'created_at',
            'updated_at'
        )

    def create(self, validated_data, user_id):
        json_parent = validated_data.pop('parent')
        kwargs = {
            **validated_data,
            'user_id': user_id,
            'parent_id': json_parent['id']
        }
        return Folder.objects.create(**kwargs)
