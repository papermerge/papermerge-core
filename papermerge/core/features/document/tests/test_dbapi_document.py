import os
import io
from datetime import date as Date
from datetime import datetime
from pathlib import Path
import pytest
from sqlalchemy import func, select
from sqlalchemy.orm import selectinload

from papermerge.core.constants import ContentType
from papermerge.core.db.engine import Session
from papermerge.core.features.custom_fields.db import orm as cf_orm
from papermerge.core.features.document import schema
from papermerge.core.features.document.db import api as dbapi
from papermerge.core.features.document.db import orm as docs_orm
from papermerge.core.schemas import error as err_schema


DIR_ABS_PATH = os.path.abspath(os.path.dirname(__file__))
RESOURCES = Path(DIR_ABS_PATH) / "resources"


def test_get_doc_last_ver(db_session: Session, make_document, user):
    doc: schema.Document = make_document(
        title="some doc", user=user, parent=user.home_folder
    )
    assert len(doc.versions) == 1

    dbapi.version_bump(db_session, doc_id=doc.id, user_id=user.id)
    dbapi.version_bump(db_session, doc_id=doc.id, user_id=user.id)
    dbapi.version_bump(db_session, doc_id=doc.id, user_id=user.id)
    dbapi.version_bump(db_session, doc_id=doc.id, user_id=user.id)

    last_ver = dbapi.get_last_doc_ver(db_session, doc_id=doc.id, user_id=user.id)
    assert last_ver.number == 5


def test_get_doc_cfv_only_empty_values(
    db_session: Session, make_document_receipt, user
):
    """
    In this scenario we have one document of type "Groceries" i.e. a receipt.
    Groceries document type has following custom fields:
        - Effective Date (date)
        - Total (monetary)
        - Shop (string)

    `db.get_doc_cfv` method should return 3 items (each corresponding
    to one custom field) with all values (i.e. custom field values, in short cfv)
    set to None. In other words, document custom fields are returned in
    regardless if custom field has set a value or no
    """
    receipt = make_document_receipt(title="receipt-1.pdf", user=user)
    items: list[schema.CFV] = dbapi.get_doc_cfv(db_session, document_id=receipt.id)
    assert len(items) == 3
    # with just value set to None it is ambiguous:
    # was value was set to None or was value not set at all ?
    assert items[0].value is None
    # when `custom_field_value_id` is None => value was not set yet
    assert items[0].custom_field_value_id is None
    assert items[1].value is None
    assert items[1].custom_field_value_id is None
    assert items[2].value is None
    assert items[2].custom_field_value_id is None


@pytest.mark.parametrize(
    "effective_date_input",
    ["2024-10-28", "2024-10-28 00:00:00", "2024-10-28 00", "2024-10-28 anything here"],
)
def test_document_add_valid_date_cfv(
    effective_date_input, db_session: Session, make_document_receipt, user
):
    """
    Custom field of type `date` is set to string "2024-10-28"
    """
    receipt = make_document_receipt(title="receipt-1.pdf", user=user)
    # key = custom field name
    # value = custom field value
    cf = {"EffectiveDate": effective_date_input}

    dbapi.update_doc_cfv(db_session, document_id=receipt.id, custom_fields=cf)

    items: list[schema.CFV] = dbapi.get_doc_cfv(db_session, document_id=receipt.id)
    eff_date_cf = next(item for item in items if item.name == "EffectiveDate")

    assert eff_date_cf.value == Date(2024, 10, 28)


def test_document_update_custom_field_of_type_date(
    db_session: Session, make_document_receipt, user
):
    receipt = make_document_receipt(title="receipt-1.pdf", user=user)

    # add some value (for first time)
    dbapi.update_doc_cfv(
        db_session,
        document_id=receipt.id,
        custom_fields={"EffectiveDate": "2024-09-26"},
    )

    # update existing value
    dbapi.update_doc_cfv(
        db_session,
        document_id=receipt.id,
        custom_fields={"EffectiveDate": "2024-09-27"},
    )

    items: list[schema.CFV] = dbapi.get_doc_cfv(db_session, document_id=receipt.id)
    eff_date_cf = next(item for item in items if item.name == "EffectiveDate")

    # notice it is 27, not 26
    assert eff_date_cf.value == Date(2024, 9, 27)


def test_document_add_multiple_CFVs(db_session: Session, make_document_receipt, user):
    """
    In this scenario we pass multiple custom field values to
    `db.update_doc_cfv` function
    Initial document does NOT have custom field values before the update.
    """
    receipt = make_document_receipt(title="receipt-1.pdf", user=user)

    # pass 3 custom field values in one shot
    cf = {"EffectiveDate": "2024-09-26", "Shop": "Aldi", "Total": "32.97"}
    dbapi.update_doc_cfv(
        db_session,
        document_id=receipt.id,
        custom_fields=cf,
    )

    items: list[schema.CFV] = dbapi.get_doc_cfv(db_session, document_id=receipt.id)
    eff_date_cf = next(item for item in items if item.name == "EffectiveDate")
    shop_cf = next(item for item in items if item.name == "Shop")
    total_cf = next(item for item in items if item.name == "Total")

    assert eff_date_cf.value == Date(2024, 9, 26)
    assert shop_cf.value == "Aldi"
    assert total_cf.value == 32.97


def test_document_update_multiple_CFVs(
    db_session: Session, make_document_receipt, user
):
    """
    In this scenario we pass multiple custom field values to
    `db.update_doc_cfv` function.
    Initial document does have custom field values before the update.
    """
    receipt = make_document_receipt(title="receipt-1.pdf", user=user)

    # set initial CFVs
    cf = {"EffectiveDate": "2024-09-26", "Shop": "Aldi", "Total": "32.97"}
    dbapi.update_doc_cfv(
        db_session,
        document_id=receipt.id,
        custom_fields=cf,
    )

    # Update all existing CFVs in one shot
    cf = {"EffectiveDate": "2024-09-27", "Shop": "Lidl", "Total": "40.22"}
    dbapi.update_doc_cfv(
        db_session,
        document_id=receipt.id,
        custom_fields=cf,
    )

    items: list[schema.CFV] = dbapi.get_doc_cfv(db_session, document_id=receipt.id)
    eff_date_cf = next(item for item in items if item.name == "EffectiveDate")
    shop_cf = next(item for item in items if item.name == "Shop")
    total_cf = next(item for item in items if item.name == "Total")

    assert eff_date_cf.value == Date(2024, 9, 27)
    assert shop_cf.value == "Lidl"
    assert total_cf.value == 40.22


def test_document_without_cfv_update_document_type_to_none(
    db_session: Session, make_document_receipt, user
):
    """
    In this scenario we have a document of specific document type (groceries)

    If document's type is cleared (set to None) then no more custom
    fields will be returned for this document.

    In this scenario document does not have associated CFV
    """
    receipt = make_document_receipt(title="receipt-1.pdf", user=user)
    items = dbapi.get_doc_cfv(db_session, document_id=receipt.id)
    # document is of type Groceries, thus there are custom fields
    assert len(items) == 3

    dbapi.update_doc_type(
        db_session, document_id=receipt.id, document_type_id=None, user_id=user.id
    )

    items = dbapi.get_doc_cfv(db_session, document_id=receipt.id)
    # document does not have any type associated, thus no custom fields
    assert len(items) == 0

    stmt = select(func.count(cf_orm.CustomFieldValue.id)).where(
        cf_orm.CustomFieldValue.document_id == receipt.id
    )
    assert db_session.execute(stmt).scalar() == 0


def test_document_with_cfv_update_document_type_to_none(
    db_session: Session, make_document_receipt, user
):
    """
    In this scenario we have a document of specific document type (groceries)

    If document's type is cleared (set to None) then no more custom
    fields will be returned for this document.

    In this scenario document has associated CFV
    """
    receipt = make_document_receipt(title="receipt-1.pdf", user=user)
    # add some cfv
    dbapi.update_doc_cfv(
        db_session,
        document_id=receipt.id,
        custom_fields={"EffectiveDate": "2024-09-27"},
    )
    items = dbapi.get_doc_cfv(db_session, document_id=receipt.id)
    # document is of type Groceries, thus there are custom fields
    assert len(items) == 3
    # there is exactly one cfv: one value for EffectiveDate
    stmt = select(func.count(cf_orm.CustomFieldValue.id)).where(
        cf_orm.CustomFieldValue.document_id == receipt.id
    )
    assert db_session.execute(stmt).scalar() == 1

    # set document type to None
    dbapi.update_doc_type(
        db_session, document_id=receipt.id, document_type_id=None, user_id=user.id
    )

    items = dbapi.get_doc_cfv(db_session, document_id=receipt.id)
    # document does not have any type associated, thus no custom fields
    assert len(items) == 0

    stmt = select(func.count(cf_orm.CustomFieldValue.id)).where(
        cf_orm.CustomFieldValue.document_id == receipt.id
    )

    # no more associated CFVs
    assert db_session.execute(stmt).scalar() == 0


def test_document_update_string_custom_field_value_multiple_times(
    db_session: Session, make_document_receipt, user
):
    """
    Every time custom field value is updated the retrieved value
    is the latest one
    """
    receipt = make_document_receipt(title="receipt-1.pdf", user=user)

    # add some value (for first time)
    dbapi.update_doc_cfv(
        db_session,
        document_id=receipt.id,
        custom_fields={"Shop": "lidl"},
    )

    # update existing value
    dbapi.update_doc_cfv(
        db_session,
        document_id=receipt.id,
        custom_fields={"Shop": "rewe"},
    )

    items: list[schema.CFV] = dbapi.get_doc_cfv(db_session, document_id=receipt.id)
    shop_cf = next(item for item in items if item.name == "Shop")

    assert shop_cf.value == "rewe"


def test_get_docs_by_type_basic(db_session: Session, make_document_receipt, user):
    """
    `db.get_docs_by_type` must return all documents of specific type
    regardless if they (documents) have or no associated custom field values.

    In this scenario all returned documents must have custom fields with empty
    values.
    And number of returned items must be equal to the number of documents
    of type "Grocery"
    """
    doc_1 = make_document_receipt(title="receipt_1.pdf", user=user)
    make_document_receipt(title="receipt_2.pdf", user=user)
    user_id = doc_1.user.id
    type_id = doc_1.document_type.id

    items: list[schema.DocumentCFV] = dbapi.get_docs_by_type(
        db_session, type_id=type_id, user_id=user_id
    )

    assert len(items) == 2

    for i in range(0, 2):
        cf = dict([(y[0], y[1]) for y in items[i].custom_fields])
        assert cf["EffectiveDate"] is None
        assert cf["Shop"] is None
        assert cf["Total"] is None


def test_get_docs_by_type_one_doc_with_nonempty_cfv(
    db_session: Session, make_document_receipt, user
):
    """
    `db.get_docs_by_type` must return all documents of specific type
    regardless if they (documents) have or no associated custom field values.

    In this scenario one of the returned documents has all CFVs set to
    non empty values and the other one - to all values empty
    """
    doc_1 = make_document_receipt(title="receipt_1.pdf", user=user)
    make_document_receipt(title="receipt_2.pdf", user=user)
    user_id = doc_1.user.id
    type_id = doc_1.document_type.id

    # update all CFV of receipt_1.pdf to non-empty values
    dbapi.update_doc_cfv(
        db_session,
        document_id=doc_1.id,
        custom_fields={"Shop": "rewe", "EffectiveDate": "2024-10-15", "Total": "15.63"},
    )

    items: list[schema.DocumentCFV] = dbapi.get_docs_by_type(
        db_session, type_id=type_id, user_id=user_id
    )

    assert len(items) == 2

    # returned items are not sorted i.e. may be in any order
    for i in range(0, 2):
        cf = dict([(y[0], y[1]) for y in items[i].custom_fields])
        if items[i].id == doc_1.id:
            #  receipt_1.pdf has all cf set correctly
            assert cf["EffectiveDate"] == Date(2024, 10, 15)
            assert cf["Shop"] == "rewe"
            assert cf["Total"] == 15.63
        else:
            # receipt_2.pdf has all cf set to None
            assert cf["EffectiveDate"] is None
            assert cf["Shop"] is None
            assert cf["Total"] is None


def test_get_docs_by_type_one_doc_with_nonempty_cfv_with_tax_docs(
    db_session: Session, make_document_tax, user
):
    """
    `db.get_docs_by_type` must return all documents of specific type
    regardless if they (documents) have or no associated custom field values.

    In this scenario one of the returned documents has all CFVs set to
    non empty values and the other one - to all values empty

    This scenario tests documents of type "Tax" which have one custom
    field of type 'int' (cf.name = 'Year', cf.type = 'int')
    """
    doc_1 = make_document_tax(title="tax_1.pdf", user=user)
    make_document_tax(title="tax_2.pdf", user=user)
    user_id = doc_1.user.id
    type_id = doc_1.document_type.id

    # tax_1.pdf has non-empty year values
    dbapi.update_doc_cfv(
        db_session,
        document_id=doc_1.id,
        custom_fields={"Year": 2020},
    )

    items: list[schema.DocumentCFV] = dbapi.get_docs_by_type(
        db_session, type_id=type_id, user_id=user_id
    )

    assert len(items) == 2

    # returned items are not sorted i.e. may be in any order
    for i in range(0, 2):
        cf = dict([(y[0], y[1]) for y in items[i].custom_fields])
        if items[i].id == doc_1.id:
            #  tax_1.pdf has all cf set correctly
            assert cf["Year"] == "2020"
        else:
            # tax_2.pdf has all cf set to None
            assert cf["Year"] is None


def test_get_docs_by_type_one_tax_doc_ordered_asc(
    db_session: Session, make_document_tax, user
):
    """
    This scenario catches a bug.
    The problem was that if you use orders by custom field of type
    `int` (in this scenario tax document has one cf - `Year` of type `int`)
    then there is an exception.
    Exception should not happen.
    """
    doc_1 = make_document_tax(title="tax_1.pdf", user=user)
    user_id = doc_1.user.id
    type_id = doc_1.document_type.id

    # tax_1.pdf has non-empty year values
    dbapi.update_doc_cfv(
        db_session,
        document_id=doc_1.id,
        custom_fields={"Year": 2020},
    )

    # asserts that there is no exception when ordered by
    # (int) field "Year"
    items: list[schema.DocumentCFV] = dbapi.get_docs_by_type(
        db_session, type_id=type_id, user_id=user_id, order_by="Year"
    )

    assert len(items) == 1


def test_document_version_dump(db_session, make_document, user):
    doc: schema.Document = make_document(
        title="some doc", user=user, parent=user.home_folder
    )
    # initially document has only one version
    assert len(doc.versions) == 1

    dbapi.version_bump(db_session, doc_id=doc.id, user_id=user.id)

    new_doc = db_session.get(docs_orm.Document, doc.id)

    # now document has two versions
    assert len(new_doc.versions) == 2
    assert new_doc.versions[0].number == 1
    assert new_doc.versions[1].number == 2


def test_document_version_bump_from_pages(db_session, make_document, user):
    src: schema.Document = make_document(
        title="source.pdf", user=user, parent=user.home_folder
    )
    dst: schema.Document = make_document(
        title="destination.pdf", user=user, parent=user.home_folder
    )

    with Session() as s:
        PDF_PATH = RESOURCES / "three-pages.pdf"
        with open(PDF_PATH, "rb") as file:
            content = file.read()
            size = os.stat(PDF_PATH).st_size
            dbapi.upload(
                db_session=s,
                document_id=src.id,
                content=io.BytesIO(content),
                file_name="three-pages.pdf",
                size=size,
                content_type=ContentType.APPLICATION_PDF,
            )

    src_last_ver = dbapi.get_last_doc_ver(db_session, doc_id=src.id, user_id=user.id)

    _, error = dbapi.version_bump_from_pages(
        db_session,
        pages=src_last_ver.pages,
        dst_document_id=dst.id,
    )
    assert error is None
    stmt = (
        select(docs_orm.Document)
        .options(selectinload(docs_orm.Document.versions))
        .where(docs_orm.Document.id == dst.id)
    )
    fresh_dst_doc = db_session.execute(stmt).scalar()
    fresh_dst_last_ver = dbapi.get_last_doc_ver(
        db_session, doc_id=dst.id, user_id=user.id
    )

    assert len(fresh_dst_doc.versions) == 1
    assert len(fresh_dst_last_ver.pages) == 3


def test_basic_document_creation(db_session, user):
    attrs = schema.NewDocument(
        title="New Document", parent_id=user.home_folder.id, ocr=False, lang="deu"
    )
    doc, error = dbapi.create_document(db_session, attrs=attrs, user_id=user.id)
    doc: schema.Document

    assert error is None
    assert doc.title == "New Document"
    assert len(doc.versions) == 1
    assert doc.versions[0].number == 1
    assert doc.versions[0].page_count == 0
    assert doc.versions[0].size == 0


def test_document_upload_pdf(make_document, user, db_session):
    """
    Upon creation document model has exactly one document version, and
    respective document version has attribute `size` set to 0.

    Check that uploaded file is associated with already
    existing document version and document version is NOT
    incremented.
    """
    doc: schema.Document = make_document(
        title="some doc", user=user, parent=user.home_folder
    )

    with open(RESOURCES / "three-pages.pdf", "rb") as file:
        content = file.read()
        size = os.stat(RESOURCES / "three-pages.pdf").st_size
        dbapi.upload(
            db_session,
            document_id=doc.id,
            content=io.BytesIO(content),
            file_name="three-pages.pdf",
            size=size,
            content_type=ContentType.APPLICATION_PDF,
        )

    with Session() as s:
        stmt = (
            select(docs_orm.Document)
            .options(selectinload(docs_orm.Document.versions))
            .where(docs_orm.Document.id == doc.id)
        )
        fresh_doc = s.execute(stmt).scalar()

    assert len(fresh_doc.versions) == 1  # document versions was not incremented

    doc_ver = fresh_doc.versions[0]
    # uploaded file was associated to existing version (with `size` == 0)
    assert doc_ver.file_name == "three-pages.pdf"
    # `size` of the document version is now set to the uploaded file size
    assert doc_ver.size == size
    assert doc_ver.file_path.exists()


def test_document_upload_png(make_document, user, db_session):
    """
    Upon creation document model has exactly one document version, and
    respective document version has attribute `size` set to 0.

    When uploading png file, the document will end up with two versions:
     - one document version to hold the original png file
     - and document version to hold pdf file (png converted to pdf)
    """
    doc: schema.Document = make_document(
        title="some doc", user=user, parent=user.home_folder
    )
    IMAGE_PATH = RESOURCES / "one-page.png"
    with open(IMAGE_PATH, "rb") as file:
        content = file.read()
        size = os.stat(IMAGE_PATH).st_size
        _, error = dbapi.upload(
            db_session,
            document_id=doc.id,
            content=io.BytesIO(content),
            file_name="one-page.png",
            size=size,
            content_type="image/png",
        )

    with Session() as s:
        stmt = (
            select(docs_orm.Document)
            .options(selectinload(docs_orm.Document.versions))
            .where(docs_orm.Document.id == doc.id)
        )
        fresh_doc = s.execute(stmt).scalar()

    assert error is None, error
    assert len(fresh_doc.versions) == 2

    assert fresh_doc.versions[0].file_name == "one-page.png"
    assert fresh_doc.versions[0].size == size
    assert fresh_doc.versions[0].file_path.exists()

    assert fresh_doc.versions[1].file_name == "one-page.png.pdf"
    assert fresh_doc.versions[1].file_path.exists()


def test_document_upload_txt(make_document, user, db_session):
    """Uploading of txt files is not supported

    When uploading txt file `upload` method should return an error
    """

    doc: schema.Document = make_document(
        title="some doc", user=user, parent=user.home_folder
    )

    DUMMY_FILE_PATH = RESOURCES / "dummy.txt"
    with open(DUMMY_FILE_PATH, "rb") as file:
        content = file.read()
        size = os.stat(DUMMY_FILE_PATH).st_size
        fresh_doc, error = dbapi.upload(
            db_session,
            document_id=doc.id,
            content=io.BytesIO(content),
            file_name="dummy.txt",
            size=size,
            content_type="text/plain",
        )

    assert fresh_doc is None
    error: err_schema.Error
    assert len(error.messages) == 1


def test_get_last_ver_pages(db_session, make_document, user):
    ### Arrange ###

    # version numbering starts with 1
    # doc has only one version - "version.number = 1"
    doc = make_document(title="basic.pdf", user=user, parent=user.home_folder)

    # now doc has two versions
    dbapi.version_bump(db_session, doc_id=doc.id, user_id=user.id, page_count=3)
    # now doc has three versions
    dbapi.version_bump(db_session, doc_id=doc.id, user_id=user.id, page_count=3)
    # now doc has four versions
    dbapi.version_bump(db_session, doc_id=doc.id, user_id=user.id, page_count=3)

    ### Act ###
    pages = dbapi.get_last_ver_pages(db_session, document_id=doc.id, user_id=user.id)

    ### Assert
    stmt = select(docs_orm.DocumentVersion).where(
        docs_orm.DocumentVersion.document_id == doc.id,
        # get document last version; last doc ver has number 4
        docs_orm.DocumentVersion.number == 4,
    )

    last_ver = db_session.execute(stmt).scalar()

    assert len(pages) == 3
    assert last_ver.number == 4
    assert pages[0].number == 1
    assert pages[1].number == 2
    assert pages[2].number == 3
    assert pages[0].document_version_id == last_ver.id


def test_subsequent_updates_over_pages_returned_by_get_last_ver_pages(
    db_session, make_document, user
):
    """
    === SqlAlchemy learning playground ===

    Scenario in this test is not for testing a function. It is just
    for me to validated my knowledge on how db_session works!

    question: if I update ORM object (orm.Page) by attribute assignement
    will this change reflected in subsequence db_session queries?
    In other words, does change from (1) will be seen in (2)?

    As this tests assert - the answer is Yes.
    Note the tricky part - `dbapi.get_last_ver_pages` returns a list
    of pages. Updating any member of this will be reflected in
    page retrieved via same db_session!
    """
    doc = make_document(title="basic.pdf", user=user, parent=user.home_folder)

    dbapi.version_bump(db_session, doc_id=doc.id, user_id=user.id, page_count=3)
    pages = dbapi.get_last_ver_pages(db_session, document_id=doc.id, user_id=user.id)

    pages[0].text = "coco"  # (1)

    stmt = select(docs_orm.Page).where(docs_orm.Page.id == pages[0].id)

    fresh_page = db_session.execute(stmt).scalar()  # (2)

    # Does (2) contain change from (1)?
    assert fresh_page.text == "coco"


def test_update_doc_cfv_on_two_documents(make_document_receipt, user, db_session):
    """ "
    There are two receipts doc1, doc2.

    Set EffectiveDate custom field value on first document to "2024-11-21"
    and on second document to "2024-11-23" and change that custom field
    values are set correctly for each individual document
    """
    # Arrange
    doc1: docs_orm.Document = make_document_receipt(title="receipt1.pdf", user=user)
    doc2: docs_orm.Document = make_document_receipt(title="receipt2.pdf", user=user)

    cf1 = {"EffectiveDate": "2024-11-16"}  # value for doc 1
    cf2 = {"EffectiveDate": "2024-11-28"}  # value for doc 2

    # Act

    dbapi.update_doc_cfv(db_session, document_id=doc1.id, custom_fields=cf1)
    dbapi.update_doc_cfv(db_session, document_id=doc2.id, custom_fields=cf2)

    # Assert
    cf_value_doc1 = db_session.execute(
        select(cf_orm.CustomFieldValue.value_date).where(
            cf_orm.CustomFieldValue.document_id == doc1.id
        )
    ).scalar()

    cf_value_doc2 = db_session.execute(
        select(cf_orm.CustomFieldValue.value_date).where(
            cf_orm.CustomFieldValue.document_id == doc2.id
        )
    ).scalar()

    assert cf_value_doc1 == datetime(2024, 11, 16, 0, 0)
    assert cf_value_doc2 == datetime(2024, 11, 28, 0, 0)


def test_get_doc_cfv_when_multiple_documents_present(
    make_document_receipt, user, db_session
):
    doc1: docs_orm.Document = make_document_receipt(title="receipt1.pdf", user=user)
    doc2: docs_orm.Document = make_document_receipt(title="receipt2.pdf", user=user)
    doc3: docs_orm.Document = make_document_receipt(title="receipt3.pdf", user=user)

    cf1 = {"EffectiveDate": "2024-11-16", "Shop": "lidl"}  # value for doc 1
    cf2 = {"EffectiveDate": "2024-11-28"}  # value for doc 2
    cf3 = {"EffectiveDate": "2024-05-14"}  # value for doc 3

    dbapi.update_doc_cfv(db_session, document_id=doc1.id, custom_fields=cf1)
    dbapi.update_doc_cfv(db_session, document_id=doc2.id, custom_fields=cf2)
    dbapi.update_doc_cfv(db_session, document_id=doc3.id, custom_fields=cf3)

    items1 = dbapi.get_doc_cfv(db_session, document_id=doc1.id)
    items2 = dbapi.get_doc_cfv(db_session, document_id=doc2.id)
    items3 = dbapi.get_doc_cfv(db_session, document_id=doc3.id)

    doc_ids1 = {i.document_id for i in items1}
    result1 = {(i.name, i.value) for i in items1}

    doc_ids2 = {i.document_id for i in items2}
    result2 = {(i.name, i.value) for i in items2}

    doc_ids3 = {i.document_id for i in items3}
    result3 = {(i.name, i.value) for i in items3}

    assert len(items1) == 3
    assert len(doc_ids1) == 1
    assert {
        ("EffectiveDate", Date(2024, 11, 16)),
        ("Shop", "lidl"),
        ("Total", None),
    } == result1

    assert len(items2) == 3
    assert len(doc_ids2) == 1
    assert {
        ("EffectiveDate", Date(2024, 11, 28)),
        ("Shop", None),
        ("Total", None),
    } == result2

    assert len(items3) == 3
    assert len(doc_ids3) == 1
    assert {
        ("EffectiveDate", Date(2024, 5, 14)),
        ("Shop", None),
        ("Total", None),
    } == result3
