from django.urls import reverse

from rest_framework.serializers import BaseSerializer
from rest_framework_json_api import serializers
from drf_spectacular.openapi import OpenApiTypes
from drf_spectacular.utils import extend_schema_field
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

    @extend_schema_field(OpenApiTypes.STR)
    def get_download_url(self, obj):
        return reverse('download-document-version', args=[str(obj.pk)])


class DocumentVersionOcrTextSerializer(rest_serializers.Serializer):
    """Returns OCRed Text of the document"""
    text = serializers.CharField(required=False, allow_blank=True)


class DocumentVersionDownloadSerializer(BaseSerializer):
    """DocumentVersion => corresponding file bytes"""

    @property
    def fields(self):
        return {}

    def to_representation(self, instance):
        file_abs_path = instance.abs_file_path()

        with open(file_abs_path, "rb") as file:
            content = file.read()

        return content
