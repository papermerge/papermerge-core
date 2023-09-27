import io
import itertools
import os
import uuid
from pathlib import Path

from django.conf import settings
from model_bakery import baker

from papermerge.core.models import Document, DocumentVersion, User

BASE_PATH = Path(settings.BASE_DIR)
RESOURCES = Path(BASE_PATH / "resources")


def document(
    resource: str,
    user: User,
    include_ocr_data: bool = False,
) -> Document:
    """Builds a document model with associated data

    ``resource`` is name of the file from ``tests/resources/`` folder.
    """
    doc = Document.objects.create_document(
        title=resource,
        lang="deu",
        user_id=user.pk,
        parent=user.home_folder
    )

    with open(RESOURCES / resource, 'rb') as file:
        payload = file.read()

    doc.upload(
        content=io.BytesIO(payload),
        file_name=resource,
        size=os.path.getsize(RESOURCES / resource)
    )

    if include_ocr_data:
        _add_ocr_data(doc.versions.last())

    return doc


def document_version(
    page_count: int,
    pages_text=None,
    include_ocr_data: bool = False,
    **kwargs
) -> DocumentVersion:

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

    doc_version = baker.make(
        "core.DocumentVersion",
        pages=pages,
        **kwargs
    )

    if include_ocr_data:
        _add_ocr_data(doc_version)

    return doc_version


def _add_ocr_data(document_version: DocumentVersion):

    for index, page in enumerate(document_version.pages.all()):
        text = page.text or f"page text {index + 1}"

        page.txt_path.parent.mkdir(parents=True, exist_ok=True)
        with open(page.txt_path, "w") as f:
            f.write(f"{text}_txt - {uuid.uuid4()}")

        page.jpg_path.parent.mkdir(parents=True, exist_ok=True)
        with open(page.jpg_path, "w") as f:
            f.write(f"{text}_jpg - {uuid.uuid4()}")

        page.hocr_path.parent.mkdir(parents=True, exist_ok=True)
        with open(page.hocr_path, "w") as f:
            f.write(f"{text}_hocr - {uuid.uuid4()}")

        page.svg_path.parent.mkdir(parents=True, exist_ok=True)
        with open(page.svg_path, "w") as f:
            f.write(f"{text}_svg - {uuid.uuid4()}")
