from rest_framework.serializers import Serializer
from rest_framework.validators import UniqueTogetherValidator

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
    breadcrumb = serializers.SerializerMethodField()

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
            'breadcrumb',
            'tags',
            'size',
            'page_count',
            'created_at',
            'updated_at'
        )
        validators = [
            UniqueTogetherValidator(
                queryset=Document.objects.all(),
                fields=['parent', 'title']
            )
        ]

    def create(self, validated_data):
        return Document.objects.create_document(
            size=0,
            page_count=0,
            file_name=validated_data['title'],
            **validated_data
        )

    def get_breadcrumb(self, obj: Document) -> str:
        titles = [
            item.title
            for item in obj.get_ancestors()
        ]
        return '/'.join(titles)


class DocumentDetailsSerializer(serializers.ModelSerializer):
    parent = ResourceRelatedField(queryset=Folder.objects)
    versions = DocumentVersionSerializer(many=True, read_only=True)
    breadcrumb = serializers.SerializerMethodField()

    class Meta:
        model = Document
        resource_name = 'documents'
        fields = (
            'id',
            'title',
            'lang',
            'ocr',
            'ocr_status',
            'parent',
            'breadcrumb',
            'versions',
            'created_at',
            'updated_at'
        )

    def get_breadcrumb(self, obj: Document):
        return [(item.title, item.id) for item in obj.get_ancestors()]

    def to_representation(self, instance):
        result = super().to_representation(instance)
        result['parent']['type'] = 'node'
        return result


class Data_DocumentDetailsSerializer(Serializer):
    data = DocumentDetailsSerializer()


class DocumentsMergeSerializer(serializers.Serializer):
    src = serializers.UUIDField()
    dst = serializers.UUIDField()
