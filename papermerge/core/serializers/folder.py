from collections import OrderedDict

from rest_framework.validators import UniqueTogetherValidator
from rest_framework_json_api import serializers
from rest_framework_json_api.relations import ResourceRelatedField
from rest_framework_json_api.utils import get_resource_type_from_instance

from papermerge.core.models import Folder
from .tag import ColoredTagListSerializerField


class NodeRelatedField(ResourceRelatedField):

    def to_representation(self, value):
        if getattr(self, "pk_field", None) is not None:
            pk = self.pk_field.to_representation(value.pk)
        else:
            pk = value.pk

        resource_type = self.get_resource_type_from_included_serializer()
        if resource_type is None or not self._skip_polymorphic_optimization:
            resource_type = get_resource_type_from_instance(value)

        attributes = OrderedDict([
            ("title", value.title)
        ])

        return OrderedDict([
            ("type", resource_type),
            ("id", str(pk)),
            ("attributes", attributes)
        ])


class FolderSerializer(serializers.ModelSerializer):

    parent = ResourceRelatedField(queryset=Folder.objects)
    tags = ColoredTagListSerializerField(required=False)
    breadcrumb = serializers.SerializerMethodField()

    class Meta:
        model = Folder
        resource_name = 'folders'
        fields = (
            'id',
            'title',
            'parent',
            'breadcrumb',
            'tags',
            'created_at',
            'updated_at'
        )
        validators = [
            UniqueTogetherValidator(
                queryset=Folder.objects.all(),
                fields=['parent', 'title']
            )
        ]

    def get_breadcrumb(self, obj):
        return [(item.title, item.id) for item in obj.get_ancestors()]

    def to_representation(self, instance):
        result = super().to_representation(instance)
        if result['parent']:
            result['parent']['type'] = 'node'
        return result
