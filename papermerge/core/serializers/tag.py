from rest_framework_json_api import serializers
from taggit.serializers import TagListSerializerField, TagList

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

    class Meta:
        fields = '__all__'

    def to_representation(self, value):
        if not isinstance(value, TagList):
            if not isinstance(value, list):
                if self.order_by:
                    tags = value.all().order_by(*self.order_by)
                else:
                    tags = value.all()
                value = [
                    {
                        'name': tag.name,
                        'bg_color': tag.bg_color,
                        'fg_color': tag.fg_color
                    } for tag in tags
                ]
            value = TagList(value, pretty_print=self.pretty_print)

        return value
