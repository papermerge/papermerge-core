from rest_framework_json_api import serializers
from papermerge.core.models import DocumentVersion


class DocumentVersionSerializer(serializers.ModelSerializer):

    class Meta:
        model = DocumentVersion
        resource_name = 'document-versions'
        fields = (
            'id',
            'number',
            'lang',
            'file_name',
            'pages',
            'size',
            'page_count',
            'short_description',
            'document',
        )
