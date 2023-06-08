from rest_framework import serializers


class SearchResultSerializer(serializers.Serializer):
    id = serializers.UUIDField()
    text = serializers.CharField(required=False, default='')
    title = serializers.CharField()
    highlight = serializers.CharField()
    breadcrumb = serializers.ListField(
        child=serializers.CharField()
    )
    node_type = serializers.ChoiceField(choices=['document', 'folder'])
    user_id = serializers.UUIDField()
