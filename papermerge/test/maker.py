import itertools

from django.conf import settings
from pathlib import Path
from papermerge.core.models import (
    Document,
    DocumentVersion,
    User
)

from model_bakery import baker


BASE_PATH = Path(settings.BASE_DIR)
RESOURCES = Path(BASE_PATH / "resources")


def document(resource: str, user: User) -> Document:
    """Builds a document model with associated data

    ``resource`` is name of the file from ``tests/resources/`` folder.
    """
    doc = Document.objects.create_document(
        title=resource,
        lang="deu",
        user_id=user.pk,
        parent=user.home_folder
    )

    payload = open(RESOURCES / resource, 'rb')

    doc.upload(
        payload=payload,
        file_path=RESOURCES / resource,
        file_name=resource
    )

    return doc


def document_version(page_count, pages_text=None) -> DocumentVersion:

    if pages_text:
        pages = baker.prepare(
            "core.Page",
            _quantity=page_count,
            number=itertools.cycle(range(1, page_count + 1)),
            text=itertools.cycle(pages_text)
        )
    else:
        pages = baker.prepare(
            "core.Page",
            _quantity=page_count,
            number=itertools.cycle(range(1, page_count + 1))
        )

    return baker.make(
        "core.DocumentVersion",
        pages=pages
    )
