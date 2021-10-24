from os.path import getsize

from rest_framework_json_api import serializers

from mglib.pdfinfo import get_pagecount

from papermerge.core.models import (Document, User)
from papermerge.core.storage import default_storage


def default_user(user_id=None):
    user = None
    if user_id is None:
        user = User.objects.filter(
            is_superuser=True
        ).first()

    if not user:
        raise ValueError("No user was found to assign document to")

    return user


def default_lang(user_id=None):
    user = default_user(user_id=user_id)
    lang = user.preferences['ocr__OCR_Language']

    return lang


class DocumentSerializer(serializers.ModelSerializer):
    size = serializers.IntegerField(required=False)
    page_count = serializers.IntegerField(required=False)

    class Meta:
        model = Document
        resource_name = 'documents'
        fields = (
            'id',
            'title',
            'lang',
            'file_name',
            'parent_id',
            'size',
            'page_count',
            'created_at',
            'updated_at'
        )

    def create(
        self,
        validated_data,
        user_id,
        payload
    ):
        size = getsize(payload.temporary_file_path())
        page_count = 3
        kwargs = {
            'user_id': user_id,
            'title': validated_data['title'],
            'size': size,
            'lang': validated_data['lang'],
            'file_name': validated_data['title'],
            'parent_id': validated_data['parent_id'],
            'page_count': page_count
        }
        doc = Document.objects.create_document(**kwargs)

        default_storage.copy_doc(
            src=payload.temporary_file_path(),
            dst=doc.path().url()
        )

        return doc

    @staticmethod
    def get_user_properties(user):
        """Get properties of the document owner, if no owner is specified
        the document gets assigned to first superuser

        Args:
            user (User): owner object

        Returns:
            user (User): owner object
            lang (str): user language
            inbox (Folder): inbox folder
        """
