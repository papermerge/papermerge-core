from rest_framework import serializers

from papermerge.core.models import (
    User,
    Tag,
    BaseTreeNode,
    Folder,
    Document,
    DocumentVersion,
    Page
)


class TagSerializer(serializers.ModelSerializer):

    class Meta:
        model = Tag
        exclude = ('id', 'user', 'slug')


class FolderSerializer(serializers.ModelSerializer):
    breadcrumb = serializers.SerializerMethodField()
    tags = TagSerializer(many=True)

    def get_breadcrumb(self, obj) -> str:
        return obj.breadcrumb

    class Meta:
        model = Folder
        exclude = ('id', 'parent', 'user', 'lang')


class PageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Page
        exclude = (
            'id',
            'document_version',
            'norm_doc_title',
            'norm_folder_title',
            'norm_breadcrump',
            'norm_text',
            'image'
        )


class DocumentVersionSerializer(serializers.ModelSerializer):
    pages = PageSerializer(many=True)

    class Meta:
        model = DocumentVersion
        exclude = ('id', 'document')


class DocumentSerializer(serializers.ModelSerializer):
    breadcrumb = serializers.SerializerMethodField()
    tags = TagSerializer(many=True)
    versions = DocumentVersionSerializer(many=True)

    def get_breadcrumb(self, obj) -> str:
        return obj.breadcrumb

    class Meta:
        model = Document
        exclude = ('id', 'parent', 'user')


class NodeSerializer(serializers.ModelSerializer):
    breadcrumb = serializers.SerializerMethodField()

    def get_breadcrumb(self, obj) -> str:
        return obj.breadcrumb

    class Meta:
        model = BaseTreeNode
        exclude = ('id', 'parent', 'user')

    def to_representation(self, instance):
        if instance.is_folder:
            return FolderSerializer(instance.folder).data

        return DocumentSerializer(instance.document).data


class UserSerializer(serializers.ModelSerializer):
    nodes = NodeSerializer(many=True)

    class Meta:
        model = User
        exclude = ('id', 'home_folder', 'inbox_folder')
