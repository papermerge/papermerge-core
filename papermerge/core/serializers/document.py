from rest_framework_json_api import serializers

from papermerge.core.models import (
    Folder,
    Document,
    User
)


def default_document_properties(user_id=None):
    user = None
    if user_id is None:
        user = User.objects.filter(
            is_superuser=True
        ).first()

    if not user:
        raise ValueError("No user was found to assign document to")

    lang = user.preferences['ocr__OCR_Language']

    inbox, _ = Folder.objects.get_or_create(
        title=Folder.INBOX_NAME,
        parent=None,
        user=user
    )
    default_props = {
        'user_id': user.pk,
        'lang': lang,
        'parent_id': inbox.pk
    }
    return default_props


class DocumentSerializer(serializers.ModelSerializer):
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
        payload,
        payload_name
    ):
        kwargs = {
            'user_id': user_id,
            'title': validated_data['title'],
            'size': validated_data['size'],
            'lang': validated_data['lang'],
            'file_name': validated_data['title'],
            'parent_id': validated_data['parent_id'],
            'page_count': validated_data['page_count']
        }
        doc = Document.objects.create_document(**kwargs)

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
