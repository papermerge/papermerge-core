from rest_framework_json_api import serializers


class SearchResultSerializer(serializers.Serializer):
    page_id = serializers.CharField()
    document_version_id = serializers.CharField()
    document_id = serializers.CharField()
    user_id = serializers.CharField()
    title = serializers.CharField()
    breadcrumb = serializers.CharField()
