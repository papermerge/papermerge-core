from rest_framework import serializers as rest_serializers
from rest_framework_json_api import serializers
from papermerge.core.models import (
    Page
)


class PageSerializer(serializers.ModelSerializer):

    class Meta:
        model = Page
        resource_name = 'pages'
        fields = (
            'id',
            'number',
            'text',
            'lang',
            'document_version',
        )


class PageDeleteSerializer(rest_serializers.Serializer):
    # list of pages to delete
    pages = rest_serializers.ListField(
        child=rest_serializers.UUIDField()
    )


class PageReorderSerializer(rest_serializers.Serializer):
    id = rest_serializers.UUIDField()
    old_number = rest_serializers.IntegerField(
        help_text='Page position within the document before '
        " page's order change."
        'Position numbering starts with 1.'
    )
    new_number = rest_serializers.IntegerField(
        help_text='Desired new page position within the document. '
        'Position numbering starts with 1.'
    )


class PagesReorderSerializer(rest_serializers.Serializer):
    pages = PageReorderSerializer(many=True)


class PageRotateSerializer(rest_serializers.Serializer):
    id = rest_serializers.UUIDField()
    # rotation angle
    angle = rest_serializers.IntegerField()


class PagesRotateSerializer(rest_serializers.Serializer):
    pages = PageRotateSerializer(many=True)


class PagesMoveToFolderSerializer(rest_serializers.Serializer):
    pages = serializers.ListSerializer(
        child=serializers.UUIDField()
    )
    # destination folder node
    dst = rest_serializers.UUIDField()
    single_page = rest_serializers.BooleanField(default=False)
    title_format = rest_serializers.CharField(
        max_length=32,
        required=False
    )


class PagesMoveToDocumentSerializer(rest_serializers.Serializer):
    pages = serializers.ListSerializer(
        child=serializers.UUIDField()
    )
    # destination document node
    dst = rest_serializers.UUIDField()
    position = rest_serializers.IntegerField(default=-1)
