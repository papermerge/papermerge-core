import pytest

from papermerge.core.models import User, Folder, Document
from papermerge.core.backup_restore.serializers import (
    UserSerializer,
    FolderSerializer,
    DocumentSerializer
)
from papermerge.test.baker_recipes import user_recipe


@pytest.mark.django_db
def test_serialize_multiple_users():
    users = [
        {
            "id": "8445def5-2d47-4dca-ad10-bcc417f42b1b",
            "password": "pbkda=",
            "last_login": "2023-01-16T07:17:41.885535+01:00",
            "is_superuser": True,
            "username": "user1",
            "first_name": "",
            "last_name": "",
            "email": "user1@mail.com",
            "is_staff": True,
            "is_active": True,
            "date_joined": "2023-01-10T07:54:16.330231+01:00",
            "created_at": "2023-01-10T07:54:16.400001+01:00",
            "updated_at": "2023-01-10T07:54:16.431142+01:00",
            "groups": [],
            "user_permissions": [],
            "nodes": []
        },
        {
            "id": "4845def5-7847-9dca-ad10-ccb417f42b1b",
            "password": "pbkdfeSgcsddf=",
            "last_login": "2023-01-16T07:17:41.885535+01:00",
            "is_superuser": True,
            "username": "user2",
            "first_name": "",
            "last_name": "",
            "email": "user2@mail.com",
            "is_staff": True,
            "is_active": True,
            "date_joined": "2023-01-10T07:54:16.330231+01:00",
            "created_at": "2023-01-10T07:54:16.400001+01:00",
            "updated_at": "2023-01-10T07:54:16.431142+01:00",
            "groups": [],
            "user_permissions": [],
            "nodes": []
        },
    ]
    user_ser = UserSerializer(data=users, many=True)

    assert User.objects.count() == 0
    if user_ser.is_valid():
        user_ser.save()

    assert User.objects.count() == 2


@pytest.mark.django_db
def test_node_deserialization_when_node_is_a_folder():
    user = user_recipe.make(username='username1')
    node_data = {
        "breadcrumb": ".home/Some Folder/",
        "tags": [],
        "ctype": "folder",
        "title": "My Documents",
        "created_at": "2023-01-10T07:54:16.404645+01:00",
        "updated_at": "2023-01-10T07:54:16.404663+01:00"
    }

    folder_ser = FolderSerializer(data=node_data)
    if folder_ser.is_valid():
        folder_ser.save(user=user)

    assert Folder.objects.filter(user=user).count() == 3


@pytest.mark.django_db
def test_node_deserialization_when_node_is_document():
    user = user_recipe.make(username='username1')
    node_data = {
        "id": "ff2a372c-effa-4bd1-a3aa-89c05993a42b",
        "breadcrumb": ".home/My Documents/ticket.pdf",
        "tags": [],
        "versions": [
            {
                "pages": [
                    {
                        "file_path": "sidecars/X/v1/pages/0001/0001_ocr.svg",
                        "number": 1,
                        "page_count": 1,
                        "text": "blah",
                        "lang": "deu"
                    },
                ],
                "file_path": "docs/A/B/v1/brother_006477.pdf",
                "lang": "deu",
                "number": 1,
                "file_name": "brother_006477.pdf",
                "size": 566683,
                "page_count": 1,
                "short_description": "Original",
                "text": ""
            },
        ],
        "ctype": "document",
        "title": "ticket.pdf",
        "lang": "deu",
        "created_at": "2023-01-13T06:45:15.009695+01:00",
        "updated_at": "2023-01-13T06:45:54.080539+01:00",
        "ocr": True,
        "ocr_status": "succeeded"
    }

    doc_ser = DocumentSerializer(data=node_data)
    if doc_ser.is_valid():
        doc_ser.save(user=user)

    assert Document.objects.filter(user=user).count() == 1
