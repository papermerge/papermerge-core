import os
from datetime import date as Date
from decimal import Decimal
from pathlib import Path
from typing import Any

import pytest
from sqlalchemy import func, select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from papermerge.core.types import MimeType
from papermerge.core.features.custom_fields.db import orm as cf_orm
from papermerge.core.features.document import schema
from papermerge.core.features.document.db import api as dbapi
from papermerge.core.features.document.db import orm as docs_orm
from papermerge.core.schemas import error as err_schema
from papermerge.core.features.custom_fields.db import api as cf_dbapi
from papermerge.core.features.custom_fields import schema as cf_schema

DIR_ABS_PATH = os.path.abspath(os.path.dirname(__file__))
RESOURCES = Path(DIR_ABS_PATH) / "resources"


async def test_get_doc_last_ver(db_session: AsyncSession, make_document, user):
    doc: schema.Document = await make_document(
        title="some doc", user=user, parent=user.home_folder
    )
    assert len(doc.versions) == 1

    await dbapi.version_bump(
        db_session,
        doc_id=doc.id,
        user_id=user.id
    )
    await dbapi.version_bump(db_session, doc_id=doc.id, user_id=user.id)
    await dbapi.version_bump(db_session, doc_id=doc.id, user_id=user.id)
    await dbapi.version_bump(db_session, doc_id=doc.id, user_id=user.id)

    last_ver = await dbapi.get_last_doc_ver(db_session, doc_id=doc.id)
    assert last_ver.number == 5


async def test_get_doc_cfv_only_empty_values(
    db_session: AsyncSession, make_document_receipt, user
):
    """
    In this scenario we have one document of type "Groceries" i.e. a receipt.
    Groceries document type has following custom fields:
        - Effective Date (date)
        - Total (monetary)
        - Shop (text)
    """
    receipt = await make_document_receipt(title="receipt-1.pdf", user=user)
    items: list[cf_schema.CustomFieldWithValue] = await cf_dbapi.get_document_custom_field_values(
        db_session,
        document_id=receipt.id
    )

    assert len(items) == 3

    assert items[0].value is None
    assert items[0].custom_field.name in {"EffectiveDate", "Total", "Shop"}
    assert items[1].value is None
    assert items[1].custom_field.name in {"EffectiveDate", "Total", "Shop"}
    assert items[2].value is None
    assert items[2].custom_field.name in {"EffectiveDate", "Total", "Shop"}


@pytest.mark.parametrize(
    "effective_date_input",
    ["2024-10-28", "2024-10-28 00:00:00", "2024-10-28 00", "2024-10-28 anything here"],
)
async def test_document_add_valid_date_cfv(
    effective_date_input,
    db_session: AsyncSession,
    make_document_receipt,
    user
):
    """
    Custom field of type `date` is set to string "2024-10-28"
    """
    receipt = await make_document_receipt(title="receipt-1.pdf", user=user)
    # key = custom field name
    # value = custom field value
    cf = {"EffectiveDate": effective_date_input}

    items: list[cf_schema.CustomFieldWithValue] = await cf_dbapi.update_document_custom_field_values(
        db_session,
        document_id=receipt.id,
        custom_fields=cf
    )

    eff_date_cf = next(item for item in items if item.custom_field.name == "EffectiveDate")

    assert eff_date_cf.value.value_date == Date(2024, 10, 28)


async def test_document_update_custom_field_of_type_date(
    db_session: AsyncSession, make_document_receipt, user
):
    receipt = await make_document_receipt(title="receipt-1.pdf", user=user)

    # add some value (for first time)
    await cf_dbapi.update_document_custom_field_values(
        db_session,
        document_id=receipt.id,
        custom_fields={"EffectiveDate": "2024-09-26"},
    )

    # update existing value
    items: list[cf_schema.CustomFieldWithValue] = await cf_dbapi.update_document_custom_field_values(
        db_session,
        document_id=receipt.id,
        custom_fields={"EffectiveDate": "2024-09-27"},
    )

    eff_date_cf = next(item for item in items if item.custom_field.name == "EffectiveDate")

    # notice it is 27, not 26
    assert eff_date_cf.value.value_date == Date(2024, 9, 27)


async def test_document_add_multiple_CFVs(db_session: AsyncSession, make_document_receipt, user):
    """
    In this scenario we pass multiple custom field values to
    `cf_dbapi.update_document_custom_field_values` function
    Initial document does NOT have custom field values before the update.
    """
    receipt = await make_document_receipt(title="receipt-1.pdf", user=user)

    # pass 3 custom field values in one shot
    cf = {"EffectiveDate": "2024-09-26", "Shop": "Aldi", "Total": "32.97"}
    items: list[cf_schema.CustomFieldWithValue] = await cf_dbapi.update_document_custom_field_values(
        db_session,
        document_id=receipt.id,
        custom_fields=cf,
    )

    eff_date_cf = next(item for item in items if item.custom_field.name == "EffectiveDate")
    shop_cf = next(item for item in items if item.custom_field.name == "Shop")
    total_cf = next(item for item in items if item.custom_field.name == "Total")

    assert eff_date_cf.value.value_date == Date(2024, 9, 26)
    assert shop_cf.value.value.raw == "Aldi"  # Use .value.raw to get original text (not lowercase)
    assert total_cf.value.value_numeric == Decimal("32.97")  # Monetary/number stored as Decimal


async def test_document_update_multiple_CFVs(
    db_session: AsyncSession, make_document_receipt, user
):
    """
    In this scenario we pass multiple custom field values to
    `cf_dbapi.update_document_custom_field_values` function.
    Initial document does have custom field values before the update.
    """
    receipt = await make_document_receipt(title="receipt-1.pdf", user=user)

    # set initial CFVs
    cf = {"EffectiveDate": "2024-09-26", "Shop": "Aldi", "Total": "32.97"}
    await cf_dbapi.update_document_custom_field_values(
        db_session,
        document_id=receipt.id,
        custom_fields=cf,
    )

    # Update all existing CFVs in one shot
    cf = {"EffectiveDate": "2024-09-27", "Shop": "Lidl", "Total": "40.22"}
    items: list[cf_schema.CustomFieldWithValue] = await cf_dbapi.update_document_custom_field_values(
        db_session,
        document_id=receipt.id,
        custom_fields=cf,
    )

    eff_date_cf = next(item for item in items if item.custom_field.name == "EffectiveDate")
    shop_cf = next(item for item in items if item.custom_field.name == "Shop")
    total_cf = next(item for item in items if item.custom_field.name == "Total")

    assert eff_date_cf.value.value_date == Date(2024, 9, 27)
    assert shop_cf.value.value.raw == "Lidl"
    assert total_cf.value.value_numeric == Decimal("40.22")


async def test_document_without_cfv_update_document_type_to_none(
    db_session: AsyncSession, make_document_receipt, user
):
    """
    In this scenario we have a document of specific document type (groceries)

    If document's type is cleared (set to None) then no more custom
    fields will be returned for this document.

    In this scenario document does not have associated CFV
    """
    receipt = await make_document_receipt(title="receipt-1.pdf", user=user)
    items: list[tuple[cf_schema.CustomField, Any]] = await cf_dbapi.get_document_custom_field_values(
        db_session,
        document_id=receipt.id
    )
    # document is of type Groceries, thus there are custom fields
    assert len(items) == 3

    await dbapi.update_doc_type(db_session, document_id=receipt.id, document_type_id=None)

    items = await cf_dbapi.get_document_custom_field_values(
        db_session,
        document_id=receipt.id
    )
    # document does not have any type associated, thus no custom fields
    assert len(items) == 0

    stmt = select(func.count(cf_orm.CustomFieldValue.id)).where(
        cf_orm.CustomFieldValue.document_id == receipt.id
    )
    assert (await db_session.execute(stmt)).scalar() == 0


async def test_document_with_cfv_update_document_type_to_none(
    db_session: AsyncSession, make_document_receipt, user
):
    """
    In this scenario we have a document of specific document type (groceries)

    If document's type is cleared (set to None) then no more custom
    fields will be returned for this document.

    In this scenario document has associated CFV
    """
    receipt = await make_document_receipt(title="receipt-1.pdf", user=user)
    # add some cfv
    await cf_dbapi.update_document_custom_field_values(
        db_session,
        document_id=receipt.id,
        custom_fields={"EffectiveDate": "2024-09-27"},
    )
    items: list[tuple[cf_schema.CustomField, Any]] = await cf_dbapi.get_document_custom_field_values(
        db_session,
        document_id=receipt.id
    )
    # document is of type Groceries, thus there are custom fields
    assert len(items) == 3
    # there is exactly one cfv: one value for EffectiveDate
    stmt = select(func.count(cf_orm.CustomFieldValue.id)).where(
        cf_orm.CustomFieldValue.document_id == receipt.id
    )
    assert (await db_session.execute(stmt)).scalar() == 1

    # set document type to None
    await dbapi.update_doc_type(db_session, document_id=receipt.id, document_type_id=None)

    items = await cf_dbapi.get_document_custom_field_values(
        db_session,
        document_id=receipt.id
    )
    # document does not have any type associated, thus no custom fields
    assert len(items) == 0

    stmt = select(func.count(cf_orm.CustomFieldValue.id)).where(
        cf_orm.CustomFieldValue.document_id == receipt.id
    )

    # no more associated CFVs
    assert (await db_session.execute(stmt)).scalar() == 0


async def test_document_update_string_custom_field_value_multiple_times(
    db_session: AsyncSession, make_document_receipt, user
):
    """
    Every time custom field value is updated the retrieved value
    is the latest one
    """
    receipt = await make_document_receipt(title="receipt-1.pdf", user=user)

    # add some value (for first time)
    await cf_dbapi.update_document_custom_field_values(
        db_session,
        document_id=receipt.id,
        custom_fields={"Shop": "lidl"},
    )

    # update existing value
    items: list[cf_schema.CustomFieldWithValue] = await cf_dbapi.update_document_custom_field_values(
        db_session,
        document_id=receipt.id,
        custom_fields={"Shop": "rewe"},
    )

    shop_cf = next(item for item in items if item.custom_field.name == "Shop")

    assert shop_cf.value.value.raw == "rewe"


async def test_get_docs_by_type_without_cf(
    db_session: AsyncSession, make_document, make_document_type_without_cf, user
):
    """
    `db.get_docs_by_type` must return all documents of specific type
    regardless if they have or no associated custom field.
    """
    dtype = await make_document_type_without_cf(name="resume")
    doc_1 = await make_document(title="receipt_1.pdf", user=user, parent=user.home_folder)
    doc_2 = await make_document(title="receipt_2.pdf", user=user, parent=user.home_folder)
    await dbapi.update_doc_type(db_session, document_id=doc_1.id, document_type_id=dtype.id)
    await dbapi.update_doc_type(db_session, document_id=doc_2.id, document_type_id=dtype.id)

    items = await dbapi.get_documents_by_type_paginated(
        db_session,
        document_type_id=dtype.id,
        user_id=user.id,
        page_size=5,
        page_number=1
    )

    assert items.total_items == 2


async def test_get_docs_by_type_basic(db_session: AsyncSession, make_document_receipt, user):
    """
    `cf_dbapi.get_document_table_data` must return all documents of specific type
    regardless if they (documents) have or no associated custom field values.

    In this scenario all returned documents must have custom fields with empty
    values.
    And number of returned items must be equal to the number of documents
    of type "Grocery"
    """
    doc_1 = await make_document_receipt(title="receipt_1.pdf", user=user)
    await make_document_receipt(title="receipt_2.pdf", user=user)
    type_id = doc_1.document_type.id

    fields, rows = await cf_dbapi.get_document_table_data(
        db_session,
        document_type_id=type_id,
        user_id=user.id
    )

    assert len(rows) == 2

    # Get field IDs by name for easier access
    field_id_map = {f.name: f.id for f in fields}

    for row in rows:
        # Access values using field_<field_id> keys
        assert row[f'field_{field_id_map["EffectiveDate"]}'] is None
        assert row[f'field_{field_id_map["Shop"]}'] is None
        assert row[f'field_{field_id_map["Total"]}'] is None


async def test_get_docs_by_type_one_doc_with_nonempty_cfv(
    db_session: AsyncSession,
    make_document_receipt,
    user
):
    """
    `cf_dbapi.get_document_table_data` must return all documents of specific type
    regardless if they (documents) have or no associated custom field values.

    In this scenario one of the returned documents has all CFVs set to
    non empty values and the other one - to all values empty
    """
    doc_1 = await make_document_receipt(title="receipt_1.pdf", user=user)
    await make_document_receipt(title="receipt_2.pdf", user=user)
    type_id = doc_1.document_type.id

    # update all CFV of receipt_1.pdf to non-empty values
    await cf_dbapi.update_document_custom_field_values(
        db_session,
        document_id=doc_1.id,
        custom_fields={"Shop": "rewe", "EffectiveDate": "2024-10-15", "Total": "15.63"},
    )

    fields, rows = await cf_dbapi.get_document_table_data(
        db_session,
        document_type_id=type_id,
        user_id=user.id
    )

    assert len(rows) == 2

    # Get field IDs by name for easier access
    field_id_map = {f.name: f.id for f in fields}

    # returned rows are not sorted i.e. may be in any order
    for row in rows:
        if row['document_id'] == doc_1.id:
            # receipt_1.pdf has all cf set correctly
            eff_date_value = row[f'field_{field_id_map["EffectiveDate"]}']
            shop_value = row[f'field_{field_id_map["Shop"]}']
            total_value = row[f'field_{field_id_map["Total"]}']

            assert eff_date_value.value_date == Date(2024, 10, 15)
            assert shop_value.value.raw == "rewe"
            assert total_value.value_numeric == Decimal("15.63")
        else:
            # receipt_2.pdf has all cf set to None
            assert row[f'field_{field_id_map["EffectiveDate"]}'] is None
            assert row[f'field_{field_id_map["Shop"]}'] is None
            assert row[f'field_{field_id_map["Total"]}'] is None

async def test_get_docs_by_type_one_doc_with_nonempty_cfv_with_tax_docs(
    db_session: AsyncSession, make_document_tax, user
):
    """
    `cf_dbapi.get_document_table_data` must return all documents of specific type
    regardless if they (documents) have or no associated custom field values.

    In this scenario one of the returned documents has all CFVs set to
    non empty values and the other one - to all values empty

    This scenario tests documents of type "Tax" which have one custom
    field of type 'integer' (cf.name = 'Year', cf.type_handler = 'integer')
    """
    doc_1 = await make_document_tax(title="tax_1.pdf", user=user)
    await make_document_tax(title="tax_2.pdf", user=user)
    user_id = user.id
    type_id = doc_1.document_type.id

    # tax_1.pdf has non-empty year values
    await cf_dbapi.update_document_custom_field_values(
        db_session,
        document_id=doc_1.id,
        custom_fields={"Year": 2020},
    )

    fields, rows = await cf_dbapi.get_document_table_data(
        db_session,
        document_type_id=type_id,
        user_id=user_id
    )

    assert len(rows) == 2

    # Get field IDs by name for easier access
    field_id_map = {f.name: f.id for f in fields}

    # returned rows are not sorted i.e. may be in any order
    for row in rows:
        if row['document_id'] == doc_1.id:
            # tax_1.pdf has all cf set correctly
            year_value = row[f'field_{field_id_map["Year"]}']
            assert year_value.value_numeric == Decimal("2020")
        else:
            # tax_2.pdf has all cf set to None
            assert row[f'field_{field_id_map["Year"]}'] is None


async def test_get_docs_by_type_one_tax_doc_ordered_asc(
    db_session: AsyncSession, make_document_tax, user
):
    """
    This scenario catches a bug.
    The problem was that if you use ordering by custom field of type
    `integer` (in this scenario tax document has one cf - `Year` of type `integer`)
    then there is an exception.
    Exception should not happen.
    """
    doc_1 = await make_document_tax(title="tax_1.pdf", user=user)
    user_id = user.id
    type_id = doc_1.document_type.id

    # tax_1.pdf has non-empty year values
    await cf_dbapi.update_document_custom_field_values(
        db_session,
        document_id=doc_1.id,
        custom_fields={"Year": 2020},
    )

    # Get the Year field to create sort specification
    stmt = select(cf_orm.CustomField).where(cf_orm.CustomField.name == "Year")
    year_field = (await db_session.execute(stmt)).scalar_one()

    # Create sort specification
    sort_spec = cf_schema.CustomFieldSort(
        field_id=year_field.id,
        direction="asc"
    )

    # asserts that there is no exception when ordered by
    # (integer) field "Year"
    fields, rows = await cf_dbapi.get_document_table_data(
        db_session,
        document_type_id=type_id,
        user_id=user_id,
        sort=sort_spec
    )

    assert len(rows) == 1

async def test_document_version_dump(db_session: AsyncSession, make_document, user):
    doc: schema.Document = await make_document(
        title="some doc", user=user, parent=user.home_folder
    )
    # initially document has only one version
    assert len(doc.versions) == 1

    await dbapi.version_bump(db_session, doc_id=doc.id, user_id=user.id)

    new_doc = await db_session.get(docs_orm.Document, doc.id)

    # now document has two versions
    assert len(new_doc.versions) == 2
    assert new_doc.versions[0].number == 1
    assert new_doc.versions[1].number == 2


@pytest.mark.skip(reason="is not async")
async def test_document_version_bump_from_pages(db_session: AsyncSession, make_document, user):
    src: schema.Document = await make_document(
        title="source.pdf", user=user, parent=user.home_folder
    )
    dst: schema.Document = await make_document(
        title="destination.pdf", user=user, parent=user.home_folder
    )

    PDF_PATH = RESOURCES / "three-pages.pdf"
    with open(PDF_PATH, "rb") as file:
        content = file.read()
        size = os.stat(PDF_PATH).st_size
        await dbapi.save_upload_metadata(
            db_session=db_session,
            document_id=src.id,
            file_name="three-pages.pdf",
            size=size,
            content_type=MimeType.application_pdf,
            created_by=user.id
        )

    src_last_ver = await dbapi.get_last_doc_ver(db_session, doc_id=src.id)

    _, error = await dbapi.version_bump_from_pages(
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
    fresh_dst_doc = (await db_session.execute(stmt)).scalar()
    fresh_dst_last_ver = await dbapi.get_last_doc_ver(db_session, doc_id=dst.id)

    assert len(fresh_dst_doc.versions) == 1
    assert len(fresh_dst_last_ver.pages) == 3


async def test_basic_document_creation(db_session: AsyncSession, user):
    attrs = schema.NewDocument(
        title="New Document",
        parent_id=user.home_folder.id,
        ocr=False,
        lang="deu",
        created_by=user.id,
        updated_by=user.id
    )
    doc, error = await dbapi.create_document(db_session, attrs=attrs, mime_type=MimeType.application_pdf)
    doc: schema.Document

    assert error is None
    assert doc.title == "New Document"
    assert len(doc.versions) == 1
    assert doc.versions[0].number == 1
    assert doc.versions[0].page_count == 0
    assert doc.versions[0].size == 0


async def test_document_upload_pdf(make_document, user, db_session: AsyncSession):
    """
    Upon creation document model has exactly one document version, and
    respective document version has attribute `size` set to 0.

    Check that uploaded file is associated with already
    existing document version and document version is NOT
    incremented.
    """
    doc: schema.Document = await make_document(
        title="some doc", user=user, parent=user.home_folder
    )

    with open(RESOURCES / "three-pages.pdf", "rb") as file:
        content = file.read()
        size = os.stat(RESOURCES / "three-pages.pdf").st_size
        await dbapi.save_upload_metadata(
            db_session,
            document_id=doc.id,
            file_name="three-pages.pdf",
            size=size,
            content_type=MimeType.application_pdf,
            created_by=user.id
        )

    stmt = (
        select(docs_orm.Document)
        .options(selectinload(docs_orm.Document.versions))
        .where(docs_orm.Document.id == doc.id)
    )
    fresh_doc = (await db_session.execute(stmt)).scalar()

    assert len(fresh_doc.versions) == 1  # document versions was not incremented

    doc_ver = fresh_doc.versions[0]
    # uploaded file was associated to existing version (with `size` == 0)
    assert doc_ver.file_name == "three-pages.pdf"
    # `size` of the document version is now set to the uploaded file size
    assert doc_ver.size == size



async def test_document_upload_png(make_document, user, db_session: AsyncSession):
    """
    Upon creation document model has exactly one document version, and
    respective document version has attribute `size` set to 0.

    When uploading png file, the document will end up with two versions:
     - one document version to hold the original png file
     - and document version to hold pdf file (png converted to pdf)
    """
    doc: schema.Document = await make_document(
        title="some doc", user=user, parent=user.home_folder
    )
    IMAGE_PATH = RESOURCES / "one-page.png"
    with open(IMAGE_PATH, "rb") as file:
        content = file.read()
        size = os.stat(IMAGE_PATH).st_size
        _, error = await dbapi.save_upload_metadata(
            db_session,
            document_id=doc.id,
            file_name="one-page.png",
            size=size,
            content_type=MimeType.image_png,
            created_by=user.id
        )

    stmt = (
        select(docs_orm.Document)
        .options(selectinload(docs_orm.Document.versions))
        .where(docs_orm.Document.id == doc.id)
    )
    fresh_doc = (await db_session.execute(stmt)).scalar()

    assert error is None, error
    assert len(fresh_doc.versions) == 2

    assert fresh_doc.versions[0].file_name == "one-page.png"
    assert fresh_doc.versions[0].size == size

    assert fresh_doc.versions[1].file_name == "one-page.png.pdf"


async def test_document_upload_txt(make_document, user, db_session: AsyncSession):
    """Uploading of txt files is not supported

    When uploading txt file `upload` method should return an error
    """

    doc: schema.Document = await make_document(
        title="some doc", user=user, parent=user.home_folder
    )

    DUMMY_FILE_PATH = RESOURCES / "dummy.txt"
    with open(DUMMY_FILE_PATH, "rb") as file:
        content = file.read()
        size = os.stat(DUMMY_FILE_PATH).st_size
        fresh_doc, error = await dbapi.save_upload_metadata(
            db_session,
            document_id=doc.id,
            file_name="dummy.txt",
            size=size,
            content_type="text/plain",
            created_by=user.id
        )

    assert fresh_doc is None
    error: err_schema.Error
    assert len(error.messages) == 1


async def test_get_last_ver_pages(db_session: AsyncSession, make_document, user):
    ### Arrange ###

    # version numbering starts with 1
    # doc has only one version - "version.number = 1"
    doc = await make_document(title="basic.pdf", user=user, parent=user.home_folder)

    # now doc has two versions
    await dbapi.version_bump(db_session, doc_id=doc.id, user_id=user.id, page_count=3)
    # now doc has three versions
    await dbapi.version_bump(db_session, doc_id=doc.id, user_id=user.id, page_count=3)
    # now doc has four versions
    await dbapi.version_bump(db_session, doc_id=doc.id, user_id=user.id, page_count=3)

    ### Act ###
    pages = await dbapi.get_last_ver_pages(db_session, document_id=doc.id, user_id=user.id)

    ### Assert
    stmt = select(docs_orm.DocumentVersion).where(
        docs_orm.DocumentVersion.document_id == doc.id,
        # get document last version; last doc ver has number 4
        docs_orm.DocumentVersion.number == 4,
    )

    last_ver = (await db_session.execute(stmt)).scalar()

    assert len(pages) == 3
    assert last_ver.number == 4
    assert pages[0].number == 1
    assert pages[1].number == 2
    assert pages[2].number == 3
    assert pages[0].document_version_id == last_ver.id


async def test_subsequent_updates_over_pages_returned_by_get_last_ver_pages(
    db_session: AsyncSession, make_document, user
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
    doc = await make_document(title="basic.pdf", user=user, parent=user.home_folder)

    await dbapi.version_bump(db_session, doc_id=doc.id, user_id=user.id, page_count=3)
    pages = await dbapi.get_last_ver_pages(db_session, document_id=doc.id, user_id=user.id)

    pages[0].text = "coco"  # (1)

    stmt = select(docs_orm.Page).where(docs_orm.Page.id == pages[0].id)

    fresh_page = (await db_session.execute(stmt)).scalar()  # (2)

    # Does (2) contain change from (1)?
    assert fresh_page.text == "coco"


async def test_update_doc_cfv_on_two_documents(make_document_receipt, user, db_session: AsyncSession):
    """
    There are two receipts doc1, doc2.

    Set EffectiveDate custom field value on first document to "2024-11-16"
    and on second document to "2024-11-28" and check that custom field
    values are set correctly for each individual document
    """
    # Arrange
    doc1: docs_orm.Document = await make_document_receipt(title="receipt1.pdf", user=user)
    doc2: docs_orm.Document = await make_document_receipt(title="receipt2.pdf", user=user)

    cf1 = {"EffectiveDate": "2024-11-16"}  # value for doc 1
    cf2 = {"EffectiveDate": "2024-11-28"}  # value for doc 2

    # Act
    await cf_dbapi.update_document_custom_field_values(
        db_session,
        document_id=doc1.id,
        custom_fields=cf1
    )
    await cf_dbapi.update_document_custom_field_values(
        db_session,
        document_id=doc2.id,
        custom_fields=cf2
    )

    # Assert
    cf_value_doc1 = (await db_session.execute(
        select(cf_orm.CustomFieldValue.value_date).where(
            cf_orm.CustomFieldValue.document_id == doc1.id
        )
    )).scalar()

    cf_value_doc2 = (await db_session.execute(
        select(cf_orm.CustomFieldValue.value_date).where(
            cf_orm.CustomFieldValue.document_id == doc2.id
        )
    )).scalar()

    assert cf_value_doc1 == Date(2024, 11, 16)
    assert cf_value_doc2 == Date(2024, 11, 28)

async def test_get_doc_cfv_when_multiple_documents_present(
    make_document_receipt, user, db_session: AsyncSession
):
    doc1: docs_orm.Document = await make_document_receipt(title="receipt1.pdf", user=user)
    doc2: docs_orm.Document = await make_document_receipt(title="receipt2.pdf", user=user)
    doc3: docs_orm.Document = await make_document_receipt(title="receipt3.pdf", user=user)

    cf1 = {"EffectiveDate": "2024-11-16", "Shop": "lidl"}  # value for doc 1
    cf2 = {"EffectiveDate": "2024-11-28"}  # value for doc 2
    cf3 = {"EffectiveDate": "2024-05-14"}  # value for doc 3

    await cf_dbapi.update_document_custom_field_values(
        db_session, document_id=doc1.id, custom_fields=cf1
    )
    await cf_dbapi.update_document_custom_field_values(
        db_session, document_id=doc2.id, custom_fields=cf2
    )
    await cf_dbapi.update_document_custom_field_values(
        db_session, document_id=doc3.id, custom_fields=cf3
    )

    items1: list[cf_schema.CustomFieldWithValue] = await cf_dbapi.get_document_custom_field_values(
        db_session, document_id=doc1.id
    )
    items2: list[cf_schema.CustomFieldWithValue] = await cf_dbapi.get_document_custom_field_values(
        db_session, document_id=doc2.id
    )
    items3: list[cf_schema.CustomFieldWithValue] = await cf_dbapi.get_document_custom_field_values(
        db_session, document_id=doc3.id
    )

    # Extract document IDs and field name/value pairs
    doc_ids1 = {item.value.document_id for item in items1 if item.value is not None}
    result1 = set()
    for i in items1:
        if i.custom_field.name == "EffectiveDate":
            result1.add((i.custom_field.name, i.value.value_date if i.value else None))
        elif i.custom_field.name == "Shop":
            result1.add((i.custom_field.name, i.value.value.raw if i.value else None))
        elif i.custom_field.name == "Total":
            result1.add((i.custom_field.name, i.value.value_numeric if i.value else None))

    doc_ids2 = {item.value.document_id for item in items2 if item.value is not None}
    result2 = set()
    for i in items2:
        if i.custom_field.name == "EffectiveDate":
            result2.add((i.custom_field.name, i.value.value_date if i.value else None))
        elif i.custom_field.name == "Shop":
            result2.add((i.custom_field.name, i.value.value.raw if i.value else None))
        elif i.custom_field.name == "Total":
            result2.add((i.custom_field.name, i.value.value_numeric if i.value else None))

    doc_ids3 = {item.value.document_id for item in items3 if item.value is not None}
    result3 = set()
    for i in items3:
        if i.custom_field.name == "EffectiveDate":
            result3.add((i.custom_field.name, i.value.value_date if i.value else None))
        elif i.custom_field.name == "Shop":
            result3.add((i.custom_field.name, i.value.value.raw if i.value else None))
        elif i.custom_field.name == "Total":
            result3.add((i.custom_field.name, i.value.value_numeric if i.value else None))

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
