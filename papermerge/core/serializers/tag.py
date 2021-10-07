from rest_framework_json_api import serializers

from papermerge.core.models import Tag


class TagSerializer(serializers.ModelSerializer):

    class Meta:
        model = Tag
        resource_name = 'tag'
        fields = [
            'id',
            'name',
            'bg_color',
            'fg_color',
            'description',
            'pinned',
        ]
