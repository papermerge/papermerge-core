from rest_framework import serializers as rest_serializers
from rest_framework_json_api import serializers

from django.urls import reverse

from papermerge.core.models import Page


class PageSerializer(serializers.ModelSerializer):

    svg_url = serializers.SerializerMethodField()
    jpg_url = serializers.SerializerMethodField()

    class Meta:
        model = Page
        resource_name = 'pages'
        fields = (
            'id',
            'number',
            'text',
            'lang',
            'document_version',
            'svg_url',
            'jpg_url'
        )

    def get_svg_url(self, obj):
        return reverse('pages_page', args=[str(obj.pk)])

    def get_jpg_url(self, obj):
        return reverse('pages_page', args=[str(obj.pk)])


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
    # If`merge` is True - ONLY new pages will be inserted in the
    # newly created document version.
    merge = rest_serializers.BooleanField(default=False)
    # if `merge` is True, then `position` field is discarded
    # if `merge` is False, then `position` field indicates
    # at which position should new pages be inserted:
    # 0 - at the beginning
    # 1 - after first page
    # 2 - after second page
    # ...
    # -1 - at the end
    position = rest_serializers.IntegerField(default=-1)
