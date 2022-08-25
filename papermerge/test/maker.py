import os
import uuid
import itertools

from django.conf import settings
from pathlib import Path
from papermerge.core.models import (
    Document,
    DocumentVersion,
    User
)
from papermerge.core.storage import abs_path

from model_bakery import baker


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

    payload = open(RESOURCES / resource, 'rb')

    doc.upload(
        payload=payload,
        file_path=RESOURCES / resource,
        file_name=resource
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


def _make_sure_path_exists(filepath):
    dirname = os.path.dirname(filepath)
    os.makedirs(
        dirname,
        exist_ok=True
    )


def _add_ocr_data(document_version: DocumentVersion):

    for index, page in enumerate(document_version.pages.all()):

        text = page.text or f"page text {index + 1}"

        txt_url = abs_path(page.page_path.txt_url)
        _make_sure_path_exists(txt_url)
        with open(txt_url, "w") as f:
            f.write(f"{text}_txt - {uuid.uuid4()}")

        jpg_url = abs_path(page.page_path.jpg_url)
        _make_sure_path_exists(jpg_url)
        with open(jpg_url, "w") as f:
            f.write(f"{text}_jpg - {uuid.uuid4()}")

        hocr_url = abs_path(page.page_path.hocr_url)
        _make_sure_path_exists(hocr_url)
        with open(hocr_url, "w") as f:
            f.write(f"{text}_hocr - {uuid.uuid4()}")

        svg_url = abs_path(page.page_path.svg_url)
        _make_sure_path_exists(svg_url)
        with open(svg_url, "w") as f:
            f.write(f"{text}_svg - {uuid.uuid4()}")
