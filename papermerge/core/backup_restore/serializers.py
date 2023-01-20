from pathlib import PurePath

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
        exclude = ('id', 'slug', 'user')


class FolderSerializer(serializers.ModelSerializer):
    breadcrumb = serializers.SerializerMethodField()
    tags = TagSerializer(many=True)

    def get_breadcrumb(self, obj) -> str:
        return obj.breadcrumb

    class Meta:
        model = Folder
        exclude = ('id', 'parent', 'user', 'lang')

    def create(self, validated_data):
        user = validated_data.pop('user')
        tags = validated_data.pop('tags', [])
        tag_names = [tag['name'] for tag in tags]

        folder = Folder.objects.create(user=user, **validated_data)
        folder.tags.set(
            tag_names,
            tag_kwargs={"user": user}
        )

        return folder


class PageSerializer(serializers.ModelSerializer):
    file_path = serializers.SerializerMethodField()
    text = serializers.CharField(allow_blank=True)

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

    def create(self, validated_data):
        doc_ver = validated_data.pop('document_version')
        page = Page.objects.create(
            document_version=doc_ver,
            **validated_data
        )
        return page


class DocumentVersionSerializer(serializers.ModelSerializer):
    pages = PageSerializer(many=True)
    file_path = serializers.SerializerMethodField()

    class Meta:
        model = DocumentVersion
        exclude = ('id', 'document')

    def get_file_path(self, obj) -> str:
        return obj.document_path.url

    def create(self, validated_data):
        document = validated_data.pop('document')
        pages = validated_data.pop('pages')
        doc_ver = DocumentVersion.objects.create(
            document=document,
            **validated_data
        )
        for page in pages:
            page_ser = PageSerializer(data=page)
            page_ser.is_valid(raise_exception=True)
            page_ser.save(document_version=doc_ver)

        return doc_ver


class DocumentSerializer(serializers.ModelSerializer):
    breadcrumb = serializers.SerializerMethodField()
    tags = TagSerializer(many=True)
    versions = DocumentVersionSerializer(many=True)

    def get_breadcrumb(self, obj) -> str:
        return obj.breadcrumb

    class Meta:
        model = Document
        exclude = ('parent', 'user')

    def create(self, validated_data):
        user = validated_data.pop('user')
        tags = validated_data.pop('tags', [])
        tag_names = [tag['name'] for tag in tags]

        versions = validated_data.pop('versions')
        doc = Document.objects.create(user=user, **validated_data)

        doc.tags.set(
            tag_names,
            tag_kwargs={"user": user}
        )

        for version in versions:
            doc_ver_ser = DocumentVersionSerializer(data=version)
            doc_ver_ser.is_valid(raise_exception=True)
            doc_ver_ser.save(document=doc)

        return doc


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


def restore_nodes_hierarchy(nodes: list, user: User) -> None:
    for node in RestoreSequence(nodes):
        # .home and .inbox folders are created automaticalally
        # upon user creation.
        if node['title'] == Folder.HOME_TITLE:
            continue
        if node['title'] == Folder.INBOX_TITLE:
            continue

        node['user'] = user
        if node['ctype'] == 'folder':
            node_ser = FolderSerializer(data=node)
        else:
            node_ser = DocumentSerializer(data=node)

        parent_breadcrumb = PurePath(node['breadcrumb']).parent
        parent = None
        if parent_breadcrumb != PurePath('.'):
            parent = Folder.objects.get_by_breadcrumb(
                str(parent_breadcrumb),
                user
            )
        node_ser.is_valid(raise_exception=True)
        node_ser.save(user=user, parent=parent)


class UserSerializer(serializers.ModelSerializer):
    nodes = NodeSerializer(many=True)
    tags = TagSerializer(many=True)

    def create(self, validated_data):
        nodes = validated_data.pop('nodes', [])
        tags = validated_data.pop('tags', [])
        validated_data.pop('groups', []),
        validated_data.pop('user_permissions', [])
        user = User.objects.create(**validated_data)

        for tag_data in tags:
            tag_ser = TagSerializer(data=tag_data)
            tag_ser.is_valid(raise_exception=True)
            tag_ser.save(user=user)

        restore_nodes_hierarchy(nodes, user)

        return user

    class Meta:
        model = User
        exclude = ('home_folder', 'inbox_folder')
