from django.urls import reverse

from rest_framework_json_api import serializers
from rest_framework import serializers as rest_serializers
from papermerge.core.models import DocumentVersion


class DocumentVersionSerializer(serializers.ModelSerializer):

    download_url = serializers.SerializerMethodField()

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
            'download_url'
        )

    def get_download_url(self, obj):
        return reverse('download-document-version', args=[str(obj.pk)])


class DocumentVersionOcrTextSerializer(rest_serializers.Serializer):
    """Returns OCRed Text of the document"""
    text = serializers.CharField(required=False, allow_blank=True)
