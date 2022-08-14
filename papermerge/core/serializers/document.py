from rest_framework_json_api import serializers
from rest_framework_json_api.relations import ResourceRelatedField

from papermerge.core.models import Folder
from papermerge.core.models import Document

from .document_version import DocumentVersionSerializer
from .tag import ColoredTagListSerializerField


class CurrentUserDefaultLang:
    """
    Returns the current user's default OCR language.
    """
    requires_context = True

    def __call__(self, serializer_field):
        user = serializer_field.context['request'].user
        return user.preferences['ocr__language']


class DocumentSerializer(serializers.ModelSerializer):
    size = serializers.IntegerField(required=False)
    page_count = serializers.IntegerField(required=False)
    parent = ResourceRelatedField(queryset=Folder.objects)
    file_name = serializers.CharField(required=False)
    ocr = serializers.BooleanField(required=False)
    lang = serializers.CharField(
        required=False,
        default=CurrentUserDefaultLang()
    )
    ocr_status = serializers.CharField(required=False)
    tags = ColoredTagListSerializerField(required=False)

    class Meta:
        model = Document
        resource_name = 'documents'
        fields = (
            'id',
            'title',
            'lang',
            'ocr',
            'ocr_status',
            'file_name',
            'parent',
            'tags',
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
    versions = DocumentVersionSerializer(many=True, read_only=True)

    class Meta:
        model = Document
        resource_name = 'documents'
        fields = (
            'id',
            'title',
            'lang',
            'file_name',
            'ocr',
            'ocr_status',
            'parent',
            'versions',
            'size',
            'page_count',
            'created_at',
            'updated_at'
        )


class DocumentsMergeSerializer(serializers.Serializer):
    src = serializers.UUIDField()
    dst = serializers.UUIDField()
