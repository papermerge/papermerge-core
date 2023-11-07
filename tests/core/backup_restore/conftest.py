import pytest


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


VERSIONS = [
    {
        "id": "0b5b21e7-9880-4321-83a2-7be1741a94de",
        "number": 1,
        "lang": "deu",
        "file_name": "4-page-doc.pdf",
        "size": 32793,
        "page_count": 4,
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
