import datetime
import json
import pathlib
from uuid import UUID

import pytest

from papermerge.core.backup_restore import types

RESOURCES_DIR = pathlib.Path(__file__).parents[2].absolute() / 'resources'


@pytest.fixture
def list_with_one_user() -> list[dict]:

    return [
        {
            "id": "1cc2b1ef-d2d2-42da-9f7f-584b939d0102",
            "username": "admin",
            "email": "admin@example.com",
            "created_at": "2023-11-07 05:16:39.849445+00:00",
            "updated_at": "2023-11-07 05:16:39.849446+00:00",
            "home_folder_id": "65829c83-6a70-406e-95aa-c9a3be9ebf33",
            "inbox_folder_id": "21cd2d1f-aad5-4281-b472-530b41d51e4d",
            "password": "some-hash-here",
            "nodes": [
                {
                    "id": "65829c83-6a70-406e-95aa-c9a3be9ebf33",
                    "title": ".home",
                    "ctype": "folder",
                    "created_at": "2023-11-07 05:16:39.850228+00:00",
                    "updated_at": "2023-11-07 05:16:39.850230+00:00",
                    "breadcrumb": [
                        [
                            "65829c83-6a70-406e-95aa-c9a3be9ebf33",
                            ".home"
                        ]
                    ]
                },
                {
                    "id": "21cd2d1f-aad5-4281-b472-530b41d51e4d",
                    "title": ".inbox",
                    "ctype": "folder",
                    "created_at": "2023-11-07 05:16:39.850230+00:00",
                    "updated_at": "2023-11-07 05:16:39.850230+00:00",
                    "breadcrumb": [
                        [
                            "21cd2d1f-aad5-4281-b472-530b41d51e4d",
                            ".inbox"
                        ]
                    ]
                },
                {
                    "id": "52cc39ca-3409-4c4c-92c5-87a31189e48c",
                    "title": "4-page-doc.pdf",
                    "ctype": "document",
                    "created_at": "2023-11-07 05:17:21.175945+00:00",
                    "updated_at": "2023-11-07 05:17:22.701701+00:00",
                    "breadcrumb": [
                        [
                            "65829c83-6a70-406e-95aa-c9a3be9ebf33",
                            ".home"
                        ],
                        [
                            "52cc39ca-3409-4c4c-92c5-87a31189e48c",
                            "4-page-doc.pdf"
                        ]
                    ],
                    "versions": VERSIONS,
                    "ocr": True,
                    "ocr_status": "SUCCESS"
                }
            ]
        }
    ]


@pytest.fixture
def pyjohn() -> types.User:
    user = {
        'id': '3564411e-fddf-44b9-866d-0ffe81a02dba',
        'username': 'john',
        'email': 'admin@example.com',
        'created_at': datetime.datetime(
            2023,
            11,
            9,
            6,
            43,
            52,
            8599
        ),
        'updated_at': datetime.datetime(
            2023,
            11,
            9,
            6,
            43,
            52,
            8600
         ),
        'home_folder_id': UUID('48310d04-29d8-42d5-b5c6-65bc34d8ebea'),
        'inbox_folder_id': UUID('26957c80-1853-4b4b-bffa-12771df969bc'),
        'password': 'hash-thingy'
    }

    return types.User(**user)


VERSIONS = [
    {
        "id": "0b5b21e7-9880-4321-83a2-7be1741a94de",
        "number": 1,
        "lang": "deu",
        "file_name": "4-page-doc.pdf",
        "size": 32793,
        "page_count": 4,
        "text": "",
        "short_description": "Original",
        "pages": [
            {
                "id": "72a3f76f-06ab-459c-8e07-dabe63d33d40",
                "number": 1,
                "text": "",
                "lang": "deu"
            },
            {
                "id": "2c768bb1-0fe2-4fd4-bcde-a9c4871a8568",
                "number": 2,
                "text": "",
                "lang": "deu"
            },
            {
                "id": "715581a6-b338-45ce-9d43-c18cc2738160",
                "number": 3,
                "text": "",
                "lang": "deu"
            },
            {
                "id": "06329866-d1d4-4f61-9be0-77580b4d38c1",
                "number": 4,
                "text": "",
                "lang": "deu"
            }
        ]
    },
    {
        "id": "c1479726-e843-471d-9aa3-e3684754c3ca",
        "number": 2,
        "lang": "deu",
        "file_name": "4-page-doc.pdf",
        "size": 0,
        "page_count": 4,
        "text": "Meine Katze ist blau\n "
        "Fische sprechen nicht\n Oma kocht jeden Tag\n",
        "short_description": "with OCRed text layer",
        "pages": [
            {
                "id": "1f18966d-710e-45a6-9ea2-d99ceba20c4a",
                "number": 1,
                "text": "Meine Katze ist blau\n",
                "lang": "deu"
            },
            {
                "id": "f2d33997-7ee2-4b1f-a9cb-a22e3e161d2b",
                "number": 2,
                "text": "Fische sprechen nicht\n",
                "lang": "deu"
            },
            {
                "id": "7b603ffc-1af3-4da0-8733-1bd16444bae6",
                "number": 3,
                "text": "Oma kocht jeden Tag\n",
                "lang": "deu"
            },
            {
                "id": "a3a7aff8-77ac-4bae-b105-b487cf9eacf3",
                "number": 4,
                "text": "",
                "lang": "deu"
            }
        ]
    }
]


@pytest.fixture
def backup_1():
    with open(RESOURCES_DIR / 'backup-1.json') as file:
        backup_dict = json.load(file)

    return types.Backup(**backup_dict)


@pytest.fixture
def backup_with_tags():
    with open(RESOURCES_DIR / 'backup-with-tags.json') as file:
        backup_dict = json.load(file)

    return types.Backup(**backup_dict)
