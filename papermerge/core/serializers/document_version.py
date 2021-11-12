from rest_framework_json_api import serializers
from papermerge.core.models import DocumentVersion


class DocumentVersionSerializer(serializers.ModelSerializer):
    size = serializers.IntegerField(required=False)
    page_count = serializers.IntegerField(required=False)
    file_name = serializers.CharField(required=False)

    class Meta:
        model = DocumentVersion
        resource_name = 'document-details'
        fields = (
            'id',
            'number',
            'lang',
            'file_name',
            'version_pages',
            'size',
            'page_count',
            'document',
        )
