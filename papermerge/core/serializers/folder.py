from rest_framework_json_api import serializers

from papermerge.core.models import Folder


class FolderSerializer(serializers.ModelSerializer):
    class Meta:
        model = Folder
        resource_name = 'folders'
        fields = (
            'id',
            'title',
            'created_at',
            'updated_at'
        )

    def create(self, validated_data, user_id):
        kwargs = {
            **validated_data,
            'user_id': user_id
        }
        return Folder.objects.create(**kwargs)
