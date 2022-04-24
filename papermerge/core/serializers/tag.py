from rest_framework_json_api import serializers
from taggit.serializers import TagListSerializerField

from papermerge.core.models import Tag


class TagSerializer(serializers.ModelSerializer):

    class Meta:
        model = Tag
        resource_name = 'tags'
        fields = (
            'id',
            'name',
            'bg_color',
            'fg_color',
            'description',
            'pinned',
        )


class ColoredTagListSerializerField(TagListSerializerField):
    child = TagSerializer()
