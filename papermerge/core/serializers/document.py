from os.path import getsize

from rest_framework_json_api import serializers
from rest_framework_json_api.relations import ResourceRelatedField

from mglib.pdfinfo import get_pagecount

from papermerge.core.models import Folder
from papermerge.core.models import (Document, User)
from papermerge.core.storage import default_storage


class DocumentSerializer(serializers.ModelSerializer):
    size = serializers.IntegerField(required=False)
    page_count = serializers.IntegerField(required=False)
    parent = ResourceRelatedField(queryset=Folder.objects)

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

    def create(
        self,
        validated_data,
        user_id,
        payload=None
    ):
        if payload:
            size = getsize(payload.temporary_file_path())
            page_count = 3
        else:
            size = 0
            page_count = 0
        kwargs = {
            'user_id': user_id,
            'title': validated_data['title'],
            'size': size,
            'lang': validated_data['lang'],
            'file_name': validated_data['title'],
            'parent_id': validated_data['parent'].id,
            'page_count': page_count
        }
        doc = Document.objects.create_document(**kwargs)

        if payload:
            default_storage.copy_doc(
                src=payload.temporary_file_path(),
                dst=doc.path().url()
            )

        return doc
