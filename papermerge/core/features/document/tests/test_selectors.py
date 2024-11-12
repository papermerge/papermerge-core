import pytest

from papermerge.core.features.document.db import selectors
from papermerge.core import dbapi, orm


def test_select_doc_cf(make_document_receipt, user, db_session):
    doc = make_document_receipt(title="receipt.pdf", user=user)

    selector = selectors.select_doc_cf(document_id=doc.id)
    rows = db_session.execute(selector)
    cf_names = list(row.name for row in rows)

    assert len(cf_names) == 3
    assert {"Total", "EffectiveDate", "Shop"} == set(cf_names)


def test_select_doc_cfv_only_empty_values(make_document_receipt, user, db_session):
    doc = make_document_receipt(title="receipt.pdf", user=user)

    selector = selectors.select_doc_cfv(document_id=doc.id)
    rows = db_session.execute(selector)
    cf_names = list((row.cf_name, row.cf_value) for row in rows)

    assert len(cf_names) == 3
    assert {("Total", None), ("EffectiveDate", None), ("Shop", None)} == set(cf_names)


@pytest.mark.parametrize(
    "effective_date_input",
    ["2024-10-28", "2024-10-28 00:00:00", "2024-10-28 00", "2024-10-28 anything here"],
)
def test_select_doc_cfv_with_date_non_empty(
    effective_date_input, make_document_receipt, user, db_session
):
    doc = make_document_receipt(title="receipt.pdf", user=user)

    selector = selectors.select_doc_cfv(document_id=doc.id)
    cf = {"EffectiveDate": effective_date_input}

    dbapi.update_doc_cfv(db_session, document_id=doc.id, custom_fields=cf)

    rows = db_session.execute(selector)
    cf_names = list((row.cf_name, row.cf_value) for row in rows)

    assert len(cf_names) == 3
    assert {
        ("Total", None),
        ("EffectiveDate", "2024-10-28"),
        ("Shop", None),
    } == set(cf_names)


def test_select_doc_type_cfv(make_document_receipt, user, db_session):
    doc1: orm.Document = make_document_receipt(title="receipt1.pdf", user=user)
    doc2 = make_document_receipt(title="receipt2.pdf", user=user)

    cf1 = {"EffectiveDate": "2024-11-21"}
    cf2 = {"EffectiveDate": "2024-11-23"}

    dbapi.update_doc_cfv(db_session, document_id=doc1.id, custom_fields=cf1)
    dbapi.update_doc_cfv(db_session, document_id=doc2.id, custom_fields=cf2)

    stmt = selectors.select_doc_type_cfv(doc1.document_type_id, cf_name="EffectiveDate")
    results = [(row.doc_id, row.cf_value) for row in db_session.execute(stmt)]

    assert len(results) == 2
