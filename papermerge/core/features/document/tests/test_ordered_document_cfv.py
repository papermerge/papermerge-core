import uuid
import datetime

from papermerge.core.features.document.schema import DocumentCFVRow
from papermerge.core.features.document.ordered_document_cfv import (
    OrderedDocumentCFV,
)


def test_ordered_document_cfv_basic():
    container = OrderedDocumentCFV()

    doc_id1 = uuid.uuid4()
    doc_id2 = uuid.uuid4()
    doc_id3 = uuid.uuid4()
    type_id = uuid.uuid4()

    rows = [
        {
            "title": "doc 1",
            "doc_id": doc_id1,
            "document_type_id": type_id,
            "cf_name": "eff date",
            "cf_type": "date",
            "cf_value": "2024-12-21",
        },
        {
            "title": "doc 1",
            "doc_id": doc_id1,
            "document_type_id": type_id,
            "cf_name": "shop",
            "cf_type": "text",
            "cf_value": "lidl",
        },
        {
            "title": "doc 1",
            "doc_id": doc_id1,
            "document_type_id": type_id,
            "cf_name": "total",
            "cf_type": "monetary",
            "cf_value": 10,
        },
        {
            "title": "doc 2",
            "doc_id": doc_id2,
            "document_type_id": type_id,
            "cf_name": "eff date",
            "cf_type": "date",
            "cf_value": "2023-06-15",
        },
        {
            "title": "doc 2",
            "doc_id": doc_id2,
            "document_type_id": type_id,
            "cf_name": "shop",
            "cf_type": "text",
            "cf_value": None,
        },
        {
            "title": "doc 2",
            "doc_id": doc_id2,
            "document_type_id": type_id,
            "cf_name": "total",
            "cf_type": "monetary",
            "cf_value": None,
        },
        {
            "title": "doc 3",
            "doc_id": doc_id3,
            "document_type_id": type_id,
            "cf_name": "eff date",
            "cf_type": "date",
            "cf_value": None,
        },
        {
            "title": "doc 3",
            "doc_id": doc_id3,
            "document_type_id": type_id,
            "cf_name": "shop",
            "cf_type": "text",
            "cf_value": None,
        },
        {
            "title": "doc 3",
            "doc_id": doc_id3,
            "document_type_id": type_id,
            "cf_name": "total",
            "cf_type": "monetary",
            "cf_value": None,
        },
    ]

    for row in rows:
        container.add(DocumentCFVRow(**row))

    docs = list(container)

    assert len(docs) == 3
    expected_cf_1 = [
        ("eff date", datetime.date(2024, 12, 21), "date"),
        ("shop", "lidl", "text"),
        ("total", 10, "monetary"),
    ]
    assert docs[0].custom_fields == expected_cf_1


def test_ordered_document_cfv_ordered_cf():
    """In this scenario, two documents are created, both
    with custom fields `xname` and `aname`.
    Although row with `xname` comes before `aname`
    the `OrderedDocumentCFV` must yield custom fields
    so that `aname` comes before `xname` - it must
    yield custom fields sorted alphabetically (by name of custom fields)
    """
    container = OrderedDocumentCFV()

    doc_id1 = uuid.uuid4()
    doc_id2 = uuid.uuid4()
    type_id = uuid.uuid4()

    rows = [
        {
            "title": "doc 1",
            "doc_id": doc_id1,
            "document_type_id": type_id,
            "cf_name": "xname",
            "cf_type": "text",
            "cf_value": "xvalue",
        },
        {
            "title": "doc 1",
            "doc_id": doc_id1,
            "document_type_id": type_id,
            "cf_name": "aname",
            "cf_type": "text",
            "cf_value": "avalue",
        },
        {
            "title": "doc 2",
            "doc_id": doc_id2,
            "document_type_id": type_id,
            "cf_name": "xname",
            "cf_type": "text",
            "cf_value": "xvalue",
        },
        {
            "title": "doc 2",
            "doc_id": doc_id2,
            "document_type_id": type_id,
            "cf_name": "aname",
            "cf_type": "text",
            "cf_value": "avalue",
        },
    ]

    for row in rows:
        container.add(DocumentCFVRow(**row))

    docs = list(container)

    # custom fields are expected to be sorted alphabetically
    # i.e. `aname` should come before `xname`
    expected_cf_1 = [
        ("aname", "avalue", "text"),
        ("xname", "xvalue", "text"),
    ]
    expected_cf_2 = [
        ("aname", "avalue", "text"),
        ("xname", "xvalue", "text"),
    ]

    assert len(docs) == 2
    assert docs[0].custom_fields == expected_cf_1
    assert docs[1].custom_fields == expected_cf_2
