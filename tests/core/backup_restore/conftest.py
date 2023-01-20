import pytest


@pytest.fixture
def ticket_pdf():
    return {
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
                        "text": "blah XYZ",
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


@pytest.fixture
def two_users():
    return [
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
            "nodes": [],
            "tags": []
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
            "nodes": [],
            "tags": []
        },
    ]


@pytest.fixture
def one_user_with_one_tag():
    return {
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
        "nodes": [],
        "tags": [
            {
                "bg_color": "#f52d00",
                "fg_color": "#ffffff",
                "description": "",
                "pinned": True,
                "name": "important"
            },
        ]
    }


@pytest.fixture
def tata_user():
    """
    User has tagged nodes.
    Also, user has a couple of unused tags.
    (i.e. tags not associated to any particular node)
    """
    return {
        "id": "c2f99b0e-7fdb-47a1-9cfc-2a24eff547d1",
        "nodes": [
            {
                "breadcrumb": ".home/My Documents/",
                "tags": [],
                "ctype": "folder",
                "title": "My Documents",
                "created_at": "2023-01-20T06:58:27.691980+01:00",
                "updated_at": "2023-01-20T06:58:27.691995+01:00"
            },
            {
                "breadcrumb": ".home/My Receipts/",
                "tags": [
                    {
                        "bg_color": "#f52d00",
                        "fg_color": "#ffffff",
                        "description": "",
                        "pinned": True,
                        "name": "important"
                    }
                ],
                "ctype": "folder",
                "title": "My Receipts",
                "created_at": "2023-01-20T06:58:27.696898+01:00",
                "updated_at": "2023-01-20T06:58:27.696910+01:00"
            },
            {
                "id": "3e6dc79c-ad28-446c-81b3-c24f5f159af8",
                "breadcrumb": ".home/Anmeldung-2016.pdf",
                "tags": [
                    {
                        "bg_color": "#f52d00",
                        "fg_color": "#ffffff",
                        "description": "",
                        "pinned": True,
                        "name": "important"
                    }
                ],
                "versions": [
                    {
                        "pages": [
                            {
                                "file_path": "sidecars/A/B/v1/pages/01/01_ocr.svg",  # noqa
                                "text": "",
                                "number": 1,
                                "page_count": 1,
                                "lang": "deu"
                            }
                        ],
                        "file_path": "docs/X/Y/v1/Anmeldung-2016.pdf",
                        "lang": "deu",
                        "number": 1,
                        "file_name": "Anmeldung-2016.pdf",
                        "size": 254930,
                        "page_count": 1,
                        "short_description": "Original",
                        "text": ""
                    },
                    {
                        "pages": [
                            {
                                "file_path": "sidecars/A/B/v2/pages/01/01_ocr.svg",  # noqa
                                "text": "Amtliche",
                                "number": 1,
                                "page_count": 1,
                                "lang": "deu"
                            }
                        ],
                        "file_path": "docs/X/Y/v2/Anmeldung-2016.pdf",
                        "lang": "deu",
                        "number": 2,
                        "file_name": "Anmeldung-2016.pdf",
                        "size": 0,
                        "page_count": 1,
                        "short_description": "with OCRed text layer",
                        "text": "Amtliche"
                    }
                ],
                "ctype": "document",
                "title": "Anmeldung-2016.pdf",
                "lang": "deu",
                "created_at": "2023-01-20T06:58:27.702234+01:00",
                "updated_at": "2023-01-20T06:58:27.702251+01:00",
                "ocr": True,
                "ocr_status": "succeeded"
            },
        ],
        "tags": [
            {  # used tag
                "bg_color": "#f52d00",
                "fg_color": "#ffffff",
                "description": "",
                "pinned": True,
                "name": "important"
            },
            {  # unused tag
                "bg_color": "#0000ff",
                "fg_color": "#ffffff",
                "description": "",
                "pinned": False,
                "name": "new"
            }
        ],
        "password": "pbkdf2_shsdd",
        "last_login": "2023-01-20T06:59:09.953316+01:00",
        "is_superuser": True,
        "username": "tata",
        "first_name": "",
        "last_name": "",
        "email": "tata@mail.com",
        "is_staff": True,
        "is_active": True,
        "date_joined": "2023-01-20T06:18:10.328571+01:00",
        "created_at": "2023-01-20T06:58:27.650355+01:00",
        "updated_at": "2023-01-20T06:58:27.688371+01:00",
        "groups": [],
        "user_permissions": []
    }


@pytest.fixture
def my_documents():
    return {
        "breadcrumb": ".home/Some Folder/",
        "tags": [],
        "ctype": "folder",
        "title": "My Documents",
        "created_at": "2023-01-10T07:54:16.404645+01:00",
        "updated_at": "2023-01-10T07:54:16.404663+01:00"
    }


@pytest.fixture
def two_versions_doc():
    """Returns Document dictionary

    Returned document has two versions.
    Each version has two pages.
    Second page was OCRed and has some text.
    """
    return {
        "id": "ff2a372c-effa-4bd1-a3aa-89c05993a42b",
        "breadcrumb": ".home/My Documents/ticket.pdf",
        "ctype": "document",
        "title": "duo-versus.pdf",
        "lang": "deu",
        "created_at": "2023-01-13T06:45:15.009695+01:00",
        "updated_at": "2023-01-13T06:45:54.080539+01:00",
        "ocr": True,
        "ocr_status": "succeeded",
        "tags": [],
        "versions": [  # two versions
            {   # version number 1
                "file_path": "docs/X/Y/v1/brother_006477.pdf",
                "lang": "deu",
                "number": 1,
                "file_name": "brother_006477.pdf",
                "size": 566683,
                "page_count": 2,
                "short_description": "Original",
                "text": "",
                "pages": [  # two pages
                    {  # page number 1
                        "file_path": "sidecars/A/B/v1/pages/01/01_ocr.svg",
                        "number": 1,
                        "page_count": 2,
                        "text": "",
                        "lang": "deu"
                    },
                    {  # page number 2
                        "file_path": "sidecars/A/B/v1/pages/02/02_ocr.svg",
                        "number": 2,
                        "page_count": 2,
                        "text": "",
                        "lang": "deu"
                    }
                ]
            },
            {  # version number 2
                "file_path": "docs/X/Y/v2/brother_006477.pdf",
                "lang": "deu",
                "number": 2,
                "file_name": "brother_006477.pdf",
                "size": 0,
                "page_count": 2,
                "short_description": "with OCRed text layer",
                "text": "Helsinki Vantaa CIUR / EUGEN MR",
                "pages": [  # two pages
                    {  # page number 1
                        "file_path": "sidecars/A/B/v2/pages/01/01_ocr.svg",
                        "number": 1,
                        "page_count": 2,
                        "text": "Helsinki Vantaa",
                        "lang": "deu"
                    },
                    {  # page number 2
                        "file_path": "sidecars/A/B/v2/pages/02/02_ocr.svg",
                        "number": 2,
                        "page_count": 2,
                        "text": "CIUR / EUGEN MR",
                        "lang": "deu"
                    }
                ]
            }
        ],
    }  # end of dictionary


@pytest.fixture
def nodes_hierarchy():
    return [
        {
            "breadcrumb": ".inbox/",
            "tags": [],
            "ctype": "folder",
            "title": ".inbox",
            "created_at": "2023-01-10T07:54:16.404645+01:00",
            "updated_at": "2023-01-10T07:54:16.404663+01:00"
        },
        {
            "breadcrumb": ".home/",
            "tags": [],
            "ctype": "folder",
            "title": ".home",
            "created_at": "2023-01-10T07:54:16.428913+01:00",
            "updated_at": "2023-01-10T07:54:16.428931+01:00"
        },
        {
            "breadcrumb": ".home/My Documents/",
            "tags": [],
            "ctype": "folder",
            "title": "My Documents",
            "created_at": "2023-01-10T09:02:03.984289+01:00",
            "updated_at": "2023-01-10T09:02:03.984343+01:00"
        },
        {
            "breadcrumb": ".home/Invoice/",
            "tags": [],
            "ctype": "folder",
            "title": "Invoice",
            "created_at": "2023-01-10T09:02:05.482186+01:00",
            "updated_at": "2023-01-10T09:02:05.482246+01:00"
        },
        {
            "id": "ff2a372c-effa-4bd1-a3aa-89c05993a42b",
            "breadcrumb": ".home/My Documents/ticket.pdf",
            "tags": [],
            "versions": [
                {
                    "pages": [
                        {
                            "file_path": "sidecars/A/B/v1/pages/01/01_ocr.svg",
                            "number": 1,
                            "page_count": 1,
                            "text": "",
                            "lang": "deu"
                        },
                    ],
                    "file_path": "docs/X/Y/v1/brother_006477.pdf",
                    "lang": "deu",
                    "number": 1,
                    "file_name": "brother_006477.pdf",
                    "size": 566683,
                    "page_count": 2,
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
        },
        {
            "breadcrumb": ".home/My Invoices/",
            "tags": [],
            "ctype": "folder",
            "title": "My Invoices",
            "created_at": "2023-01-16T07:17:56.358723+01:00",
            "updated_at": "2023-01-16T07:17:56.358739+01:00"
        },
        {
            "breadcrumb": ".home/My Invoices/Super/",
            "tags": [],
            "ctype": "folder",
            "title": "Super",
            "created_at": "2023-01-16T07:18:03.604483+01:00",
            "updated_at": "2023-01-16T07:18:03.604523+01:00"
        },
        {
            "breadcrumb": ".home/My Invoices/Super/Deep/",
            "tags": [],
            "ctype": "folder",
            "title": "Deep",
            "created_at": "2023-01-16T07:18:12.548518+01:00",
            "updated_at": "2023-01-16T07:18:12.548560+01:00"
        },
        {
            "id": "b60407fc-39f1-4c3b-9d8e-81ba5203bd4a",
            "breadcrumb": ".home/My Invoices/Super/Deep/Anmeldung-2016.pdf",
            "tags": [],
            "versions": [
                {
                    "pages": [
                        {
                            "file_path": "sidecars/A/B/v1/pages/01/01_ocr.svg",
                            "number": 1,
                            "page_count": 1,
                            "text": "",
                            "lang": "deu"
                        }
                    ],
                    "file_path": "docs/X/Y/v1/Anmeldung-2016.pdf",
                    "lang": "deu",
                    "number": 1,
                    "file_name": "Anmeldung-2016.pdf",
                    "size": 254930,
                    "page_count": 1,
                    "short_description": "Original",
                    "text": ""
                },
            ],
            "ctype": "document",
            "title": "Anmeldung-2016.pdf",
            "lang": "deu",
            "created_at": "2023-01-16T07:19:03.181742+01:00",
            "updated_at": "2023-01-16T07:19:07.679417+01:00",
            "ocr": True,
            "ocr_status": "succeeded"
        }
    ]
