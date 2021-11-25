from rest_framework_json_api import serializers
from rest_framework_json_api.relations import ResourceRelatedField

from papermerge.core.models import Folder
from papermerge.core.models import Document

from .document_version import DocumentVersionSerializer


class DocumentSerializer(serializers.ModelSerializer):
    size = serializers.IntegerField(required=False)
    page_count = serializers.IntegerField(required=False)
    parent = ResourceRelatedField(queryset=Folder.objects)
    file_name = serializers.CharField(required=False)

    class Meta:
        model = Document
        resource_name = 'documents'
        fields = (
            'id',
            'title',
            'lang',
            'file_name',
            'parent',
            'size',
            'page_count',
            'created_at',
            'updated_at'
        )

    def create(self, validated_data):
        return Document.objects.create_document(
            size=0,
            page_count=0,
            file_name=validated_data['title'],
            **validated_data
        )


class DocumentDetailsSerializer(serializers.ModelSerializer):
    size = serializers.IntegerField(required=False)
    page_count = serializers.IntegerField(required=False)
    parent = ResourceRelatedField(queryset=Folder.objects)
    file_name = serializers.CharField(required=False)
    versions = DocumentVersionSerializer(many=True)

    class Meta:
        model = Document
        resource_name = 'documents'
        fields = (
            'id',
            'title',
            'lang',
            'file_name',
            'parent',
            'versions',
            'size',
            'page_count',
            'created_at',
            'updated_at'
        )
