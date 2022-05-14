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

    def save(self, **attrs):
        user_id = attrs.get('user_id', None)
        name = self.validated_data['name']
        try:
            Tag.objects.get(name=name, user_id=user_id)
        except Tag.DoesNotExist:
            pass
        else:
            raise serializers.ValidationError(
                f"Tag with name='{name}' already exists"
            )

        return super().save(**attrs)


class ColoredTagListSerializerField(TagListSerializerField):
    child = TagSerializer()

    class Meta:
        fields = '__all__'

    def to_representation(self, value):
        if not isinstance(value, TagList):
            if not isinstance(value, list):
                # value may come in as elastic search attrlist
                # or value may come in as Django's ORM related manager
                all_method = getattr(value, "all", None)
                if callable(all_method):
                    if self.order_by:
                        tags = value.all().order_by(*self.order_by)
                    else:
                        tags = value.all()
                else:
                    # arrived here via elastic search which returns
                    # its own iterator
                    tags = value
                value = [
                    {
                        'name': tag.name,
                        'bg_color': tag.bg_color,
                        'fg_color': tag.fg_color
                    } for tag in tags
                ]
            value = TagList(value, pretty_print=self.pretty_print)

        return value
