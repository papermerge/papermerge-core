from datetime import datetime

import pytest

from papermerge.core.types import OrderEnum, CFVValueColumn
from papermerge.core.features.document.db import selectors
from papermerge.core import dbapi, orm


def test_select_cf_by_document_id_when_one_document_present(
    make_document_receipt, user, db_session
):
    """This scenario tests when there is only one document"""
    doc = make_document_receipt(title="receipt.pdf", user=user)

    selector = selectors.select_cf_by_document_id(document_id=doc.id)
    rows = db_session.execute(selector)
    cf_names = list(row.name for row in rows)

    assert len(cf_names) == 3
    assert {"Total", "EffectiveDate", "Shop"} == set(cf_names)


def test_select_cf_by_document_id_when_multiple_documents_present(
    make_document_receipt, user, db_session
):
    """This scenario tests when there are multiple documents (all of same type)"""
    doc1 = make_document_receipt(title="receipt1.pdf", user=user)
    make_document_receipt(title="receipt2.pdf", user=user)

    selector = selectors.select_cf_by_document_id(document_id=doc1.id)
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


@pytest.mark.parametrize(
    "salary_month_input",
    ["2024-10-28", "2024-10-28 00:00:00", "2024-10-28 00", "2024-10-28 anything here"],
)
def test_select_doc_cfv_with_yearmonth_non_empty(
    salary_month_input, make_document_salary, user, db_session
):
    doc = make_document_salary(title="salary.pdf", user=user)

    selector = selectors.select_doc_cfv(document_id=doc.id)
    cf = {"Month": salary_month_input}

    dbapi.update_doc_cfv(db_session, document_id=doc.id, custom_fields=cf)

    rows = db_session.execute(selector)
    cf_names = list((row.cf_name, row.cf_value) for row in rows)

    assert len(cf_names) == 3
    assert {
        ("Company", None),
        ("Month", "2024.1"),
        ("Total", None),
    } == set(cf_names)


def test_select_doc_cfv_with_tax_year_non_empty(make_document_tax, user, db_session):
    doc = make_document_tax(title="tax2020.pdf", user=user)

    selector = selectors.select_doc_cfv(document_id=doc.id)
    cf = {"Year": 2020}

    dbapi.update_doc_cfv(db_session, document_id=doc.id, custom_fields=cf)

    rows = db_session.execute(selector)
    cf_names = list((row.cf_name, row.cf_value) for row in rows)

    assert len(cf_names) == 1
    assert {
        ("Year", "2020"),
    } == set(cf_names)


def test_select_doc_type_cfv(make_document_receipt, user, db_session):
    doc1: orm.Document = make_document_receipt(title="receipt1.pdf", user=user)
    doc2 = make_document_receipt(title="receipt2.pdf", user=user)

    cf1 = {"EffectiveDate": "2024-11-16"}
    cf2 = {"EffectiveDate": "2024-11-23"}

    dbapi.update_doc_cfv(db_session, document_id=doc1.id, custom_fields=cf1)
    dbapi.update_doc_cfv(db_session, document_id=doc2.id, custom_fields=cf2)

    stmt = selectors.select_doc_type_cfv(
        doc1.document_type_id,
        cf_name="EffectiveDate",
        cfv_column_name=selectors.CFVValueColumn.DATE,
    )
    results = [(row.doc_id, row.cf_value) for row in db_session.execute(stmt)]

    assert len(results) == 2
    expected_results = {
        (doc1.id, datetime(2024, 11, 16, 0, 0)),
        (doc2.id, datetime(2024, 11, 23, 0, 0)),
    }

    assert set(results) == expected_results


def test_select_doc_type_cfv_by_salary_custom_field(
    make_document_salary, user, db_session
):
    doc1: orm.Document = make_document_salary(title="salary1.pdf", user=user)
    doc2 = make_document_salary(title="salary2.pdf", user=user)

    cf1 = {"Month": "2024-11"}
    cf2 = {"Month": "2024-03"}

    dbapi.update_doc_cfv(db_session, document_id=doc1.id, custom_fields=cf1)
    dbapi.update_doc_cfv(db_session, document_id=doc2.id, custom_fields=cf2)

    stmt = selectors.select_doc_type_cfv(
        doc1.document_type_id,
        cf_name="Month",
        cfv_column_name=selectors.CFVValueColumn.YEARMONTH,
    )
    results = [(row.doc_id, row.cf_value) for row in db_session.execute(stmt)]

    assert len(results) == 2
    expected_results = {
        (doc1.id, 2024.11),
        (doc2.id, 2024.03),
    }

    assert set(results) == expected_results


def test_select_doc_type_cfv_by_tax_year_custom_field(
    make_document_tax, user, db_session
):
    doc1: orm.Document = make_document_tax(title="tax1.pdf", user=user)
    doc2 = make_document_tax(title="tax2.pdf", user=user)

    cf1 = {"Year": 2024}
    cf2 = {"Year": 2023}

    dbapi.update_doc_cfv(db_session, document_id=doc1.id, custom_fields=cf1)
    dbapi.update_doc_cfv(db_session, document_id=doc2.id, custom_fields=cf2)

    stmt = selectors.select_doc_type_cfv(
        doc1.document_type_id,
        cf_name="Year",
        cfv_column_name=selectors.CFVValueColumn.INT,
    )
    results = [(row.doc_id, row.cf_value) for row in db_session.execute(stmt)]

    assert len(results) == 2
    expected_results = {
        (doc1.id, 2024),
        (doc2.id, 2023),
    }

    assert set(results) == expected_results


def test_select_docs_by_type_no_cfv(make_document_receipt, user, db_session):
    """
    In this scenario no document have any custom field values associated
    """
    # arrange
    doc1: orm.Document = make_document_receipt(title="receipt1.pdf", user=user)
    doc2: orm.Document = make_document_receipt(title="receipt2.pdf", user=user)

    # act
    stmt = selectors.select_docs_by_type(
        document_type_id=doc1.document_type_id, user_id=user.id, offset=0, limit=99
    )

    # assert
    results = [
        (row.doc_id, row.cf_name, row.cf_value) for row in db_session.execute(stmt)
    ]
    expected_results = {
        (doc1.id, "EffectiveDate", None),
        (doc1.id, "Shop", None),
        (doc1.id, "Total", None),
        (doc2.id, "EffectiveDate", None),
        (doc2.id, "Shop", None),
        (doc2.id, "Total", None),
    }

    assert set(results) == expected_results


def test_select_docs_by_type_with_one_doc_full_cfv(
    make_document_receipt, user, db_session
):
    """In this scenario one document has all custom fields values"""
    # arrange
    doc1: orm.Document = make_document_receipt(title="receipt1.pdf", user=user)
    doc2: orm.Document = make_document_receipt(title="receipt2.pdf", user=user)

    cf1 = {"EffectiveDate": "2024-11-16", "Shop": "lidl", "Total": "49"}
    dbapi.update_doc_cfv(db_session, document_id=doc1.id, custom_fields=cf1)

    # act
    stmt = selectors.select_docs_by_type(
        document_type_id=doc1.document_type_id, user_id=user.id, offset=0, limit=99
    )

    # assert
    results = [
        (row.doc_id, row.cf_name, row.cf_value) for row in db_session.execute(stmt)
    ]
    expected_results = {
        (doc1.id, "EffectiveDate", "2024-11-16"),
        (doc1.id, "Shop", "lidl"),
        (doc1.id, "Total", "49"),
        (doc2.id, "EffectiveDate", None),
        (doc2.id, "Shop", None),
        (doc2.id, "Total", None),
    }

    assert set(results) == expected_results


def test_select_docs_by_type_with_partially_filled_cfv(
    make_document_receipt, user, db_session
):
    """In this scenario one document has all custom fields values"""
    # arrange
    doc1: orm.Document = make_document_receipt(title="receipt1.pdf", user=user)
    doc2: orm.Document = make_document_receipt(title="receipt2.pdf", user=user)

    cf1 = {"EffectiveDate": "2024-11-16", "Shop": "lidl"}
    dbapi.update_doc_cfv(db_session, document_id=doc1.id, custom_fields=cf1)

    cf2 = {"Shop": "rewe", "Total": "9.99"}
    dbapi.update_doc_cfv(db_session, document_id=doc2.id, custom_fields=cf2)

    # act
    stmt = selectors.select_docs_by_type(
        document_type_id=doc1.document_type_id, user_id=user.id, offset=0, limit=99
    )

    # assert
    results = [
        (row.doc_id, row.cf_name, row.cf_value) for row in db_session.execute(stmt)
    ]
    expected_results = {
        (doc1.id, "EffectiveDate", "2024-11-16"),
        (doc1.id, "Shop", "lidl"),
        (doc1.id, "Total", None),
        (doc2.id, "EffectiveDate", None),
        (doc2.id, "Shop", "rewe"),
        (doc2.id, "Total", "9.99"),
    }

    assert set(results) == expected_results


def test_select_docs_by_type_ordered_date_asc(make_document_receipt, user, db_session):
    # arrange
    doc1: orm.Document = make_document_receipt(title="receipt1.pdf", user=user)
    doc2: orm.Document = make_document_receipt(title="receipt2.pdf", user=user)
    doc3: orm.Document = make_document_receipt(title="receipt3.pdf", user=user)
    doc4: orm.Document = make_document_receipt(title="receipt4.pdf", user=user)

    cf1 = {"EffectiveDate": "2024-05-16"}
    dbapi.update_doc_cfv(db_session, document_id=doc1.id, custom_fields=cf1)

    cf2 = {"EffectiveDate": "2019-01-01"}
    dbapi.update_doc_cfv(db_session, document_id=doc2.id, custom_fields=cf2)

    cf3 = {"EffectiveDate": "2024-12-25"}
    dbapi.update_doc_cfv(db_session, document_id=doc3.id, custom_fields=cf3)

    cf4 = {"EffectiveDate": "2023-04-02"}
    dbapi.update_doc_cfv(db_session, document_id=doc4.id, custom_fields=cf4)

    # act
    stmt = selectors.select_docs_by_type(
        document_type_id=doc1.document_type_id,
        user_id=user.id,
        order_by="EffectiveDate",
        cfv_column_name=CFVValueColumn.DATE,
        order=OrderEnum.asc,
        offset=0,
        limit=99,
    )

    # assert
    results = [
        (row.doc_id, row.cf_name, row.cf_value) for row in db_session.execute(stmt)
    ]
    expected_results = [
        (doc2.id, "EffectiveDate", "2019-01-01"),
        (doc2.id, "Shop", None),
        (doc2.id, "Total", None),
        (doc4.id, "EffectiveDate", "2023-04-02"),
        (doc4.id, "Shop", None),
        (doc4.id, "Total", None),
        (doc1.id, "EffectiveDate", "2024-05-16"),
        (doc1.id, "Shop", None),
        (doc1.id, "Total", None),
        (doc3.id, "EffectiveDate", "2024-12-25"),
        (doc3.id, "Shop", None),
        (doc3.id, "Total", None),
    ]

    assert results == expected_results


def test_select_docs_by_type_ordered_date_desc(
    make_document_receipt, make_document_zdf, user, db_session
):
    # arrange
    doc1: orm.Document = make_document_receipt(title="receipt1.pdf", user=user)
    doc2: orm.Document = make_document_receipt(title="receipt2.pdf", user=user)
    doc3: orm.Document = make_document_receipt(title="receipt3.pdf", user=user)
    doc4: orm.Document = make_document_receipt(title="receipt4.pdf", user=user)
    make_document_zdf(title="zdf1.pdf", user=user)
    make_document_zdf(title="zdf2.pdf", user=user)

    cf1 = {"EffectiveDate": "2024-05-16"}
    dbapi.update_doc_cfv(db_session, document_id=doc1.id, custom_fields=cf1)

    cf2 = {"EffectiveDate": "2019-01-01"}
    dbapi.update_doc_cfv(db_session, document_id=doc2.id, custom_fields=cf2)

    cf3 = {"EffectiveDate": "2024-12-25"}
    dbapi.update_doc_cfv(db_session, document_id=doc3.id, custom_fields=cf3)

    cf4 = {"EffectiveDate": "2023-04-02"}
    dbapi.update_doc_cfv(db_session, document_id=doc4.id, custom_fields=cf4)

    # act
    stmt = selectors.select_docs_by_type(
        document_type_id=doc1.document_type_id,
        user_id=user.id,
        order_by="EffectiveDate",
        cfv_column_name=CFVValueColumn.DATE,
        order=OrderEnum.desc,
        offset=0,
        limit=99,
    )

    # assert
    results = [
        (row.doc_id, row.cf_name, row.cf_value) for row in db_session.execute(stmt)
    ]
    expected_results = [
        (doc3.id, "EffectiveDate", "2024-12-25"),
        (doc3.id, "Shop", None),
        (doc3.id, "Total", None),
        (doc1.id, "EffectiveDate", "2024-05-16"),
        (doc1.id, "Shop", None),
        (doc1.id, "Total", None),
        (doc4.id, "EffectiveDate", "2023-04-02"),
        (doc4.id, "Shop", None),
        (doc4.id, "Total", None),
        (doc2.id, "EffectiveDate", "2019-01-01"),
        (doc2.id, "Shop", None),
        (doc2.id, "Total", None),
    ]

    assert results == expected_results


def test_select_docs_by_type_ordered_monetary_asc(
    make_document_receipt, user, db_session
):
    # arrange
    doc1: orm.Document = make_document_receipt(title="receipt1.pdf", user=user)
    doc2: orm.Document = make_document_receipt(title="receipt2.pdf", user=user)
    doc3: orm.Document = make_document_receipt(title="receipt3.pdf", user=user)
    doc4: orm.Document = make_document_receipt(title="receipt4.pdf", user=user)

    cf1 = {"Total": "5.95"}
    dbapi.update_doc_cfv(db_session, document_id=doc1.id, custom_fields=cf1)

    cf2 = {"Total": "2"}
    dbapi.update_doc_cfv(db_session, document_id=doc2.id, custom_fields=cf2)

    cf3 = {"Total": "5.99"}
    dbapi.update_doc_cfv(db_session, document_id=doc3.id, custom_fields=cf3)

    cf4 = {"Total": "20.34"}
    dbapi.update_doc_cfv(db_session, document_id=doc4.id, custom_fields=cf4)

    # act
    stmt = selectors.select_docs_by_type(
        document_type_id=doc1.document_type_id,
        user_id=user.id,
        order_by="Total",
        cfv_column_name=CFVValueColumn.MONETARY,
        order=OrderEnum.asc,
        offset=0,
        limit=99,
    )

    # assert
    results = [
        (row.doc_id, row.cf_name, row.cf_value) for row in db_session.execute(stmt)
    ]
    expected_results = [
        (doc2.id, "EffectiveDate", None),
        (doc2.id, "Shop", None),
        (doc2.id, "Total", "2"),
        (doc1.id, "EffectiveDate", None),
        (doc1.id, "Shop", None),
        (doc1.id, "Total", "5.95"),
        (doc3.id, "EffectiveDate", None),
        (doc3.id, "Shop", None),
        (doc3.id, "Total", "5.99"),
        (doc4.id, "EffectiveDate", None),
        (doc4.id, "Shop", None),
        (doc4.id, "Total", "20.34"),
    ]
    assert results == expected_results


def test_select_docs_by_type_ordered_monetary_desc(
    make_document_receipt, user, db_session
):
    # arrange
    doc1: orm.Document = make_document_receipt(title="receipt1.pdf", user=user)
    doc2: orm.Document = make_document_receipt(title="receipt2.pdf", user=user)
    doc3: orm.Document = make_document_receipt(title="receipt3.pdf", user=user)
    doc4: orm.Document = make_document_receipt(title="receipt4.pdf", user=user)

    cf1 = {"Total": "5.95"}
    dbapi.update_doc_cfv(db_session, document_id=doc1.id, custom_fields=cf1)

    cf2 = {"Total": "2"}
    dbapi.update_doc_cfv(db_session, document_id=doc2.id, custom_fields=cf2)

    cf3 = {"Total": "5.99"}
    dbapi.update_doc_cfv(db_session, document_id=doc3.id, custom_fields=cf3)

    cf4 = {"Total": "20.34"}
    dbapi.update_doc_cfv(db_session, document_id=doc4.id, custom_fields=cf4)

    # act
    stmt = selectors.select_docs_by_type(
        document_type_id=doc1.document_type_id,
        user_id=user.id,
        order_by="Total",
        cfv_column_name=CFVValueColumn.MONETARY,
        order=OrderEnum.desc,
        offset=0,
        limit=99,
    )

    # assert
    results = [
        (row.doc_id, row.cf_name, row.cf_value) for row in db_session.execute(stmt)
    ]
    expected_results = [
        (doc4.id, "EffectiveDate", None),
        (doc4.id, "Shop", None),
        (doc4.id, "Total", "20.34"),
        (doc3.id, "EffectiveDate", None),
        (doc3.id, "Shop", None),
        (doc3.id, "Total", "5.99"),
        (doc1.id, "EffectiveDate", None),
        (doc1.id, "Shop", None),
        (doc1.id, "Total", "5.95"),
        (doc2.id, "EffectiveDate", None),
        (doc2.id, "Shop", None),
        (doc2.id, "Total", "2"),
    ]
    assert results == expected_results


def test_select_docs_by_type_ordered_year_asc(make_document_tax, user, db_session):
    # arrange
    doc1: orm.Document = make_document_tax(title="tax1.pdf", user=user)
    doc2: orm.Document = make_document_tax(title="tax2.pdf", user=user)
    doc3: orm.Document = make_document_tax(title="tax3.pdf", user=user)

    cf1 = {"Year": 2022}
    dbapi.update_doc_cfv(db_session, document_id=doc1.id, custom_fields=cf1)

    cf2 = {"Year": 2023}
    dbapi.update_doc_cfv(db_session, document_id=doc2.id, custom_fields=cf2)

    cf3 = {"Year": 2021}
    dbapi.update_doc_cfv(db_session, document_id=doc3.id, custom_fields=cf3)

    # act
    stmt = selectors.select_docs_by_type(
        document_type_id=doc1.document_type_id,
        user_id=user.id,
        order_by="Year",
        cfv_column_name=CFVValueColumn.INT,
        order=OrderEnum.asc,
        offset=0,
        limit=99,
    )

    # assert
    results = [
        (row.doc_id, row.cf_name, row.cf_value) for row in db_session.execute(stmt)
    ]
    expected_results = [
        (doc3.id, "Year", "2021"),
        (doc1.id, "Year", "2022"),
        (doc2.id, "Year", "2023"),
    ]

    assert results == expected_results


def test_select_document_type_cfs(make_document_receipt, user, db_session):
    doc = make_document_receipt(title="receipt.pdf", user=user)
    stmt = selectors.select_document_type_cfs(doc.document_type_id, doc.user_id)

    rows = [row for row in db_session.execute(stmt)]
    # receipt document type has 3 custom fields
    assert len(rows) == 3


def test_select_docs_by_type_without_ordering(make_document_receipt, user, db_session):
    doc = make_document_receipt(title="receipt.pdf", user=user)
    stmt = selectors.select_docs_by_type_without_ordering(
        doc.document_type_id, doc.user_id
    )

    rows = [row for row in db_session.execute(stmt)]

    assert len(rows) == 3
