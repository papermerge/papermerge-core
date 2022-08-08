import os
from pikepdf import Pdf

from django.utils.html import escape

from papermerge.core.storage import abs_path


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


def insert_pdf_pages(
    src_old_version,
    dst_old_version,
    dst_new_version,
    page_numbers,
    position
):
    src_old_pdf = Pdf.open(
        abs_path(src_old_version.document_path.url)
    )
    if dst_old_version is None:
        # case of total merge
        dst_old_pdf = Pdf.new
    else:
        dst_old_pdf = Pdf.open(
            abs_path(dst_old_version.document_path.url)
        )

    _inserted_count = 0
    for page_number in page_numbers:
        pdf_page = src_old_pdf.pages.p(page_number)
        dst_old_pdf.pages.insert(position + _inserted_count, pdf_page)
        _inserted_count += 1

    dirname = os.path.dirname(
        abs_path(dst_new_version.document_path.url)
    )
    os.makedirs(dirname, exist_ok=True)
    dst_old_pdf.save(
        abs_path(dst_new_version.document_path.url)
    )


def total_merge(
        src_old_version,
        dst_new_version
):
    page_numbers = [page.number for page in src_old_version.pages]

    insert_pdf_pages(
        src_old_version=src_old_version,
        dst_old_version=None,
        dst_new_version=dst_new_version,
        page_numbers=page_numbers,
        position=0
    )
