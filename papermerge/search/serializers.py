from rest_framework_json_api import serializers

from papermerge.core.serializers.tag import ColoredTagListSerializerField


class SearchResultSerializer(serializers.Serializer):
    id = serializers.UUIDField()
    text = serializers.CharField(required=False, default='')
    title = serializers.CharField()
    tags = ColoredTagListSerializerField(required=False)
    highlight = serializers.CharField()
    breadcrumb = serializers.ListField(
        child=serializers.CharField()
    )
    node_type = serializers.ChoiceField(choices=['document', 'folder'])
    user_id = serializers.UUIDField()
