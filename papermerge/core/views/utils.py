import os
from pikepdf import Pdf

from django.utils.html import escape

from papermerge.core.storage import abs_path
from papermerge.core.models import DocumentVersion


def sanitize_kvstore(kvstore_dict):
    """
    Creates a sanitized dictionary.

    Sanitizied dictionary contains only allowed keys and escaped values.
    """
    allowed_keys = [
        'id',
        'key',
        'value',
        'kv_type',
        'kv_format',
        'kv_inherited',
    ]

    sanitized_kvstore_dict = {}

    for allowed_key in allowed_keys:
        if allowed_key in kvstore_dict.keys():
            value = kvstore_dict.get(allowed_key, None)
            if isinstance(value, bool):
                allowed_value = value
            else:
                allowed_value = escape(kvstore_dict.get(allowed_key, None))

            sanitized_kvstore_dict[allowed_key] = allowed_value

    return sanitized_kvstore_dict


def sanitize_kvstore_list(kvstore_list):
    """
    Creates a new list of sanitized dictionaries.

    Sanitizied dictionary contains only allowed keys and escaped values.
    """
    if not isinstance(kvstore_list, list):
        raise ValueError("Expects list type as input")

    new_kvstore_list = [
        sanitize_kvstore(item) for item in kvstore_list
    ]

    return new_kvstore_list


def remove_pdf_pages(
    old_version: DocumentVersion,
    new_version: DocumentVersion,
    page_numbers: list[int]
):
    """
    :param old_version: is instance of DocumentVersion
    :param new_version:  is instance of DocumentVersion
    :param page_numbers: numbers of pages to delete. Numbering starts with 1.

    Notice that page numbering starts with 1 i.e. page_numbers=[1, 2] -
    will remove first and second pages.
    """
    # delete page from document's new version associated file
    pdf = Pdf.open(
        abs_path(old_version.document_path.url)
    )
    _deleted_count = 0
    for page_number in page_numbers:
        pdf.pages.remove(p=page_number - _deleted_count)
        _deleted_count += 1

    dirname = os.path.dirname(
        abs_path(new_version.document_path.url)
    )
    os.makedirs(dirname, exist_ok=True)
    pdf.save(abs_path(new_version.document_path.url))


def insert_pdf_pages(
    src_old_version: DocumentVersion,
    dst_old_version: DocumentVersion,
    dst_new_version: DocumentVersion,
    src_page_numbers: list[int],
    dst_position: int = 0
) -> None:
    """Inserts pages from source to destination at given position

    In case both `dst_old_version` and `dst_new_version` parameters
    are non-empty `DocumentVersion` instances - `insert_pdf_pages` will take
    `src_page_numbers` from `src_old_version` and
    insert them at `dst_position` of `dst_old_version` and will
    save result in `dst_new_version`.

    In case `dst_old_version` is None - `insert_pdf_pages` will
    take `src_page_numbers` from `src_old_version` and insert
    at position 0 of the newly created pdf. Newly created pdf will be saved
    at `dst_new_version`.

    Remarks:
    `dst_position` starts with 0.
    In `src_page_numbers` page numbering starts with 1 i.e.
    when `src_page_numbers=[1, 2]` means insert first and second pages from
    source document version.
    """
    src_old_pdf = Pdf.open(
        abs_path(src_old_version.document_path.url)
    )
    if dst_old_version is None:
        # case of total merge
        dst_old_pdf = Pdf.new()
        dst_position = 0
    else:
        dst_old_pdf = Pdf.open(
            abs_path(dst_old_version.document_path.url)
        )

    _inserted_count = 0
    for page_number in src_page_numbers:
        pdf_page = src_old_pdf.pages.p(page_number)
        dst_old_pdf.pages.insert(dst_position + _inserted_count, pdf_page)
        _inserted_count += 1

    dirname = os.path.dirname(
        abs_path(dst_new_version.document_path.url)
    )
    os.makedirs(dirname, exist_ok=True)
    dst_old_pdf.save(
        abs_path(dst_new_version.document_path.url)
    )


def total_merge(
    src_old_version: DocumentVersion,
    dst_new_version: DocumentVersion
) -> None:
    """
    Merge source document version with destination

    'Total' means 'all pages'.
    """
    # all pages of the source
    page_numbers = [page.number for page in src_old_version.pages.all()]

    insert_pdf_pages(
        src_old_version=src_old_version,
        dst_old_version=None,
        dst_new_version=dst_new_version,
        src_page_numbers=page_numbers,
        dst_position=0
    )
    # Total merge deletes source document.
    # Because all pages of the source are moved to destination, source's
    # last version remains "without pages". A document version without pages
    # does not make sense to stay around - thus we delete it!
    src_old_version.document.delete()


def partial_merge(
    src_old_version: DocumentVersion,
    src_new_version: DocumentVersion,
    dst_new_version: DocumentVersion,
    page_numbers: list[int]
) -> None:
    """Merge only some pages of the source document version with destination

    No all pages of the source are used, which means
    source document version IS NOT DELETED.

    'Partial' means 'not all pages'.
    """

    if len(page_numbers) >= src_old_version.pages.count():
        raise ValueError("Number of pages to remove exceeds source page count")

    # remove pages from the source document version
    remove_pdf_pages(
        old_version=src_old_version,
        new_version=src_new_version,
        page_numbers=page_numbers
    )

    # insert pages to the destination
    insert_pdf_pages(
        src_old_version=src_old_version,
        dst_old_version=None,
        dst_new_version=dst_new_version,
        src_page_numbers=page_numbers
    )
