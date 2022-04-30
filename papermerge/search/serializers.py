from rest_framework_json_api import serializers

from papermerge.core.serializers.tag import ColoredTagListSerializerField


class SearchResultSerializer(serializers.Serializer):
    id = serializers.CharField()
    text = serializers.CharField(required=False, default='')
    title = serializers.CharField()
    tags = ColoredTagListSerializerField(required=False)
    highlight = serializers.ListField(
        child=serializers.CharField(),
        required=False,
        default=['']
    )
    breadcrumb = serializers.ListField(
        child=serializers.CharField()
    )
    node_type = serializers.ChoiceField(choices=['document', 'folder'])
    user_id = serializers.CharField()
