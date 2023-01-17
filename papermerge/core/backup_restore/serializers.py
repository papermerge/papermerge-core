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
from .utils import RestoreSequence


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
    file_path = serializers.SerializerMethodField()

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

    def get_file_path(self, obj) -> str:
        return obj.page_path.svg_url


class DocumentVersionSerializer(serializers.ModelSerializer):
    pages = PageSerializer(many=True)
    file_path = serializers.SerializerMethodField()

    class Meta:
        model = DocumentVersion
        exclude = ('id', 'document')

    def get_file_path(self, obj) -> str:
        return obj.document_path.url


class DocumentSerializer(serializers.ModelSerializer):
    breadcrumb = serializers.SerializerMethodField()
    tags = TagSerializer(many=True)
    versions = DocumentVersionSerializer(many=True)

    def get_breadcrumb(self, obj) -> str:
        return obj.breadcrumb

    class Meta:
        model = Document
        exclude = ('parent', 'user')


class NodeSerializer(serializers.ModelSerializer):
    breadcrumb = serializers.SerializerMethodField()

    def get_breadcrumb(self, obj) -> str:
        return obj.breadcrumb

    class Meta:
        model = BaseTreeNode
        exclude = ('id', 'parent', 'user')

    def create(self, validated_data):
        ctype = validated_data.pop('ctype')
        user = validated_data.pop('user')
        if ctype == 'folder':
            return Folder.objects.create(user=user, **validated_data)

    def to_representation(self, instance):
        if instance.is_folder:
            return FolderSerializer(instance.folder).data

        return DocumentSerializer(instance.document).data


class UserSerializer(serializers.ModelSerializer):
    nodes = NodeSerializer(many=True)

    def create(self, validated_data):
        nodes = validated_data.pop('nodes', [])
        validated_data.pop('groups', []),
        validated_data.pop('user_permissions', [])
        user = User.objects.create(**validated_data)

        for node in RestoreSequence(nodes):
            node['user'] = user
            node_ser = NodeSerializer(data=nodes)
            if node_ser.is_valid():
                node_ser.save()

        return user

    class Meta:
        model = User
        exclude = ('home_folder', 'inbox_folder')
