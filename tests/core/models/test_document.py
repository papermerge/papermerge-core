import io
import os
import shutil
from datetime import date as Date
from pathlib import Path
from unittest.mock import patch

import pytest
from django.db import transaction
from django.db.utils import IntegrityError
from django.utils.datetime_safe import datetime
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from papermerge.core import db, schemas
from papermerge.core.db.doc import str2date
from papermerge.core.db.models import CustomField, CustomFieldValue
from papermerge.core.features.document_types import db as db_dtype_api
from papermerge.core.models import Document, User
from papermerge.core.storage import abs_path
from papermerge.core.types import OrderEnum
from papermerge.test import TestCase
from papermerge.test.baker_recipes import document_recipe, folder_recipe, user_recipe
from papermerge.test.utils import breadcrumb_fmt

MODELS_DIR_ABS_PATH = os.path.abspath(os.path.dirname(__file__))
TEST_DIR_ABS_PATH = os.path.dirname(os.path.dirname(MODELS_DIR_ABS_PATH))


class TestDocumentModel(TestCase):
    def setUp(self):
        self.resources = Path(TEST_DIR_ABS_PATH) / "resources"
        self.user = User.objects.create_user(username="user1")
        self.media = Path(TEST_DIR_ABS_PATH) / "media"
        shutil.rmtree(self.media / "docs", ignore_errors=True)
        shutil.rmtree(self.media / "sidecars", ignore_errors=True)

    def test_basic_document_creation(self):
        """
        Asserts very basic `Document.objects.create_document method`
        """
        doc = Document.objects.create_document(
            title="invoice.pdf",
            lang="deu",
            user_id=self.user.pk,
            parent=self.user.home_folder,
        )
        self.assertTrue(doc)

        self.assertEqual(doc.versions.count(), 1)

        document_version = doc.versions.first()
        # Before any file upload, document version has
        # size = 0, page_count = 0 and Falsy file_name
        self.assertEqual(document_version.size, 0)
        self.assertEqual(document_version.page_count, 0)
        self.assertFalse(document_version.file_name)
        # document's version numbering starts with 1
        self.assertEqual(document_version.number, 1)

    def test_version_bump(self):
        """
        doc.version_bump provides an easy way to increment document version.
        """
        doc = Document.objects.create_document(
            title="invoice.pdf",
            lang="deu",
            user_id=self.user.pk,
            parent=self.user.home_folder,
        )
        self.assertEqual(doc.versions.count(), 1)
        last_version = doc.versions.last()
        self.assertEqual(last_version.number, 1)  # versioning starts with 1
        # Initial document version is created with zero pages
        # i.e. without page models associated.
        # Create 3 pages (with page models)
        last_version.create_pages(page_count=3)

        doc.version_bump()
        # was document version incremented indeed?
        self.assertEqual(doc.versions.count(), 2)

        last_doc_version = doc.versions.last()
        self.assertEqual(last_doc_version.number, 2)
        # check that associated page models were created as well
        self.assertEqual(last_doc_version.pages.count(), 3)

    def test_idified_title_one_dot_in_title(self):
        doc = Document.objects.create_document(
            title="invoice.pdf",
            lang="deu",
            user_id=self.user.pk,
            parent=self.user.home_folder,
        )

        self.assertEqual(f"invoice-{doc.id}.pdf", doc.idified_title)

    def test_idified_title_multiple_dots_in_title(self):
        doc = Document.objects.create_document(
            title="in.voi.ce.pdf",
            lang="deu",
            user_id=self.user.pk,
            parent=self.user.home_folder,
        )

        self.assertEqual(f"in.voi.ce-{doc.id}.pdf", doc.idified_title)

    @patch("papermerge.core.signals.send_ocr_task")
    def test_upload_payload_to_zero_sized_document(self, _x):
        """
        Upon creation document model has associated zero sized document_version
        i.e. document_version.size == 0.

        Check that uploaded file is associated with already
        existing document version and document version is NOT
        incremented.
        """
        doc = Document.objects.create_document(
            title="three-pages.pdf",
            lang="deu",
            user_id=self.user.pk,
            parent=self.user.home_folder,
        )

        with open(self.resources / "three-pages.pdf", "rb") as file:
            content = file.read()
            size = os.stat(self.resources / "three-pages.pdf").st_size

            last_version = doc.versions.last()
            assert doc.versions.count() == 1
            assert last_version.size == 0

            doc.upload(
                content=io.BytesIO(content), file_name="three-pages.pdf", size=size
            )

            last_version = doc.versions.last()
            assert doc.versions.count() == 1
            assert last_version.size > 0

            assert os.path.exists(abs_path(last_version.file_path))

    @patch("papermerge.core.signals.send_ocr_task")
    def test_version_bump_from_pages(self, _):
        """
        Move two pages from source document to destination document
        """
        source_doc = Document.objects.create_document(
            title="three-pages.pdf",
            lang="deu",
            user_id=self.user.pk,
            parent=self.user.home_folder,
        )

        dst_doc = Document.objects.create_document(
            title="one-page.pdf",
            lang="deu",
            user_id=self.user.pk,
            parent=self.user.home_folder,
        )

        with open(self.resources / "three-pages.pdf", "rb") as file:
            content = file.read()
            size = os.stat(self.resources / "three-pages.pdf").st_size
            source_doc.upload(
                content=io.BytesIO(content), file_name="three-pages.pdf", size=size
            )

            dst_doc.version_bump_from_pages(
                pages=source_doc.versions.last().pages.all()[1:3]
            )

            assert dst_doc.versions.count() == 1
            dst_doc_version = dst_doc.versions.last()
            assert dst_doc_version.pages.count() == 2

    def test_two_documents_with_same_title_under_same_parent(self):
        """It should not be possible to create two documents with
        same (parent, title) pair i.e. we cannot have documents with same
        title under same parent.
        """
        Document.objects.create_document(
            title="three-pages.pdf",
            lang="deu",
            user_id=self.user.pk,
            parent=self.user.home_folder,
        )
        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                Document.objects.create_document(
                    title="three-pages.pdf",
                    lang="deu",
                    user_id=self.user.pk,
                    parent=self.user.home_folder,
                )

    def test_two_documents_with_same_title_under_different_parents(self):
        """It should be possible to create two documents with
        same title given the fact that documents have different parents.
        """
        Document.objects.create_document(
            title="three-pages.pdf",
            lang="deu",
            user_id=self.user.pk,
            parent=self.user.home_folder,
        )
        Document.objects.create_document(
            title="three-pages.pdf",
            lang="deu",
            user_id=self.user.pk,
            parent=self.user.inbox_folder,  # this time - different parent
        )


@pytest.mark.django_db
def test_document_breadcrumb():
    user = user_recipe.make()
    folder1 = folder_recipe.make(title="folder1", user=user, parent=user.home_folder)
    doc = document_recipe.make(title="invoice.pdf", user=user, parent=folder1)

    actual_breadcumb = breadcrumb_fmt(doc.breadcrumb)

    assert actual_breadcumb == ".home/folder1/invoice.pdf"
    assert doc.title == "invoice.pdf"


@pytest.mark.django_db
@patch("papermerge.core.utils.image.convert_from_path")
def test_generate_thumbnail(document: Document):
    # makes sure there are no exceptions raised
    document.generate_thumbnail()


@pytest.mark.django_db(transaction=True)
def test_get_doc_cfv_only_empty_values(db_session: Session, make_document_receipt):
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
    receipt: Document = make_document_receipt(title="receipt-1.pdf")
    items: list[schemas.CFV] = db.get_doc_cfv(db_session, document_id=receipt.id)
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


@pytest.mark.django_db(transaction=True)
@pytest.mark.parametrize(
    "effective_date_input",
    ["2024-10-28", "2024-10-28 00:00:00", "2024-10-28 00", "2024-10-28 anything here"],
)
def test_document_add_valid_date_cfv(
    effective_date_input,
    db_session: Session,
    make_document_receipt,
):
    """
    Custom field of type `date` is set to string "2024-10-28"
    """
    receipt: Document = make_document_receipt(title="receipt-1.pdf")
    # key = custom field name
    # value = custom field value
    cf = {"EffectiveDate": effective_date_input}

    db.update_doc_cfv(db_session, document_id=receipt.id, custom_fields=cf)

    items: list[schemas.CFV] = db.get_doc_cfv(db_session, document_id=receipt.id)
    eff_date_cf = next(item for item in items if item.name == "EffectiveDate")

    assert eff_date_cf.value == Date(2024, 10, 28)


@pytest.mark.django_db(transaction=True)
def test_document_update_custom_field_of_type_date(
    db_session: Session,
    make_document_receipt,
):
    receipt: Document = make_document_receipt(title="receipt-1.pdf")

    # add some value (for first time)
    db.update_doc_cfv(
        db_session,
        document_id=receipt.id,
        custom_fields={"EffectiveDate": "2024-09-26"},
    )

    # update existing value
    db.update_doc_cfv(
        db_session,
        document_id=receipt.id,
        custom_fields={"EffectiveDate": "2024-09-27"},
    )

    items: list[schemas.CFV] = db.get_doc_cfv(db_session, document_id=receipt.id)
    eff_date_cf = next(item for item in items if item.name == "EffectiveDate")

    # notice it is 27, not 26
    assert eff_date_cf.value == Date(2024, 9, 27)


@pytest.mark.django_db(transaction=True)
def test_document_add_multiple_CFVs(
    db_session: Session,
    make_document_receipt,
):
    """
    In this scenario we pass multiple custom field values to
    `db.update_doc_cfv` function
    Initial document does NOT have custom field values before the update.
    """
    receipt: Document = make_document_receipt(title="receipt-1.pdf")

    # pass 3 custom field values in one shot
    cf = {"EffectiveDate": "2024-09-26", "Shop": "Aldi", "Total": "32.97"}
    db.update_doc_cfv(
        db_session,
        document_id=receipt.id,
        custom_fields=cf,
    )

    items: list[schemas.CFV] = db.get_doc_cfv(db_session, document_id=receipt.id)
    eff_date_cf = next(item for item in items if item.name == "EffectiveDate")
    shop_cf = next(item for item in items if item.name == "Shop")
    total_cf = next(item for item in items if item.name == "Total")

    assert eff_date_cf.value == Date(2024, 9, 26)
    assert shop_cf.value == "Aldi"
    assert total_cf.value == 32.97


@pytest.mark.django_db(transaction=True)
def test_document_update_multiple_CFVs(
    db_session: Session,
    make_document_receipt,
):
    """
    In this scenario we pass multiple custom field values to
    `db.update_doc_cfv` function.
    Initial document does have custom field values before the update.
    """
    receipt: Document = make_document_receipt(title="receipt-1.pdf")

    # set initial CFVs
    cf = {"EffectiveDate": "2024-09-26", "Shop": "Aldi", "Total": "32.97"}
    db.update_doc_cfv(
        db_session,
        document_id=receipt.id,
        custom_fields=cf,
    )

    # Update all existing CFVs in one shot
    cf = {"EffectiveDate": "2024-09-27", "Shop": "Lidl", "Total": "40.22"}
    db.update_doc_cfv(
        db_session,
        document_id=receipt.id,
        custom_fields=cf,
    )

    items: list[schemas.CFV] = db.get_doc_cfv(db_session, document_id=receipt.id)
    eff_date_cf = next(item for item in items if item.name == "EffectiveDate")
    shop_cf = next(item for item in items if item.name == "Shop")
    total_cf = next(item for item in items if item.name == "Total")

    assert eff_date_cf.value == Date(2024, 9, 27)
    assert shop_cf.value == "Lidl"
    assert total_cf.value == 40.22


@pytest.mark.django_db(transaction=True)
def test_document_update_string_custom_field_value_multiple_times(
    db_session: Session,
    make_document_receipt,
):
    """
    Every time custom field value is updated the retrieved value
    is the latest one
    """
    receipt: Document = make_document_receipt(title="receipt-1.pdf")

    # add some value (for first time)
    db.update_doc_cfv(
        db_session,
        document_id=receipt.id,
        custom_fields={"Shop": "lidl"},
    )

    # update existing value
    db.update_doc_cfv(
        db_session,
        document_id=receipt.id,
        custom_fields={"Shop": "rewe"},
    )

    items: list[schemas.CFV] = db.get_doc_cfv(db_session, document_id=receipt.id)
    shop_cf = next(item for item in items if item.name == "Shop")

    assert shop_cf.value == "rewe"


@pytest.mark.django_db(transaction=True)
def test_document_without_cfv_update_document_type_to_none(
    db_session: Session,
    make_document_receipt,
):
    """
    In this scenario we have a document of specific document type (groceries)

    If document's type is cleared (set to None) then no more custom
    fields will be returned for this document.

    In this scenario document does not have associated CFV
    """
    receipt: Document = make_document_receipt(title="receipt-1.pdf")
    items = db.get_doc_cfv(db_session, document_id=receipt.id)
    # document is of type Groceries, thus there are custom fields
    assert len(items) == 3
    db.update_doc_type(db_session, document_id=receipt.id, document_type_id=None)

    items = db.get_doc_cfv(db_session, document_id=receipt.id)
    # document does not have any type associated, thus no custom fields
    assert len(items) == 0

    stmt = select(func.count(CustomFieldValue.id)).where(
        CustomFieldValue.document_id == receipt.id
    )
    assert db_session.execute(stmt).scalar() == 0


@pytest.mark.django_db(transaction=True)
def test_document_with_cfv_update_document_type_to_none(
    db_session: Session,
    make_document_receipt,
):
    """
    In this scenario we have a document of specific document type (groceries)

    If document's type is cleared (set to None) then no more custom
    fields will be returned for this document.

    In this scenario document has associated CFV
    """
    receipt: Document = make_document_receipt(title="receipt-1.pdf")
    # add some cfv
    db.update_doc_cfv(
        db_session,
        document_id=receipt.id,
        custom_fields={"EffectiveDate": "2024-09-27"},
    )
    items = db.get_doc_cfv(db_session, document_id=receipt.id)
    # document is of type Groceries, thus there are custom fields
    assert len(items) == 3
    # there is exactly one cfv: one value for EffectiveDate
    stmt = select(func.count(CustomFieldValue.id)).where(
        CustomFieldValue.document_id == receipt.id
    )
    assert db_session.execute(stmt).scalar() == 1

    # set document type to None
    db.update_doc_type(db_session, document_id=receipt.id, document_type_id=None)

    items = db.get_doc_cfv(db_session, document_id=receipt.id)
    # document does not have any type associated, thus no custom fields
    assert len(items) == 0

    stmt = select(func.count(CustomFieldValue.id)).where(
        CustomFieldValue.document_id == receipt.id
    )

    # no more associated CFVs
    assert db_session.execute(stmt).scalar() == 0


@pytest.mark.django_db(transaction=True)
def test_get_docs_by_type_basic(db_session: Session, make_document_receipt):
    """
    `db.get_docs_by_type` must return all documents of specific type
    regardless if they (documents) have or no associated custom field values.

    In this scenario all returned documents must have custom fields with empty
    values.
    And number of returned items must be equal to the number of documents
    of type "Grocery"
    """
    doc_1: Document = make_document_receipt(title="receipt_1.pdf")
    make_document_receipt(title="receipt_2.pdf")
    user_id = doc_1.user.id
    type_id = doc_1.document_type.id

    items: list[schemas.DocumentCFV] = db.get_docs_by_type(
        db_session, type_id=type_id, user_id=user_id
    )

    assert len(items) == 2

    for i in range(0, 2):
        cf = dict([(y[0], y[1]) for y in items[i].custom_fields])
        assert cf["EffectiveDate"] is None
        assert cf["Shop"] is None
        assert cf["Total"] is None


@pytest.mark.django_db(transaction=True)
def test_get_docs_by_type_one_doc_with_nonempty_cfv(
    db_session: Session, make_document_receipt
):
    """
    `db.get_docs_by_type` must return all documents of specific type
    regardless if they (documents) have or no associated custom field values.

    In this scenario one of the returned documents has all CFVs set to
    non empty values and the other one - to all values empty
    """
    doc_1: Document = make_document_receipt(title="receipt_1.pdf")
    make_document_receipt(title="receipt_2.pdf")
    user_id = doc_1.user.id
    type_id = doc_1.document_type.id

    # update all CFV of receipt_1.pdf to non-empty values
    db.update_doc_cfv(
        db_session,
        document_id=doc_1.id,
        custom_fields={"Shop": "rewe", "EffectiveDate": "2024-10-15", "Total": "15.63"},
    )

    items: list[schemas.DocumentCFV] = db.get_docs_by_type(
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


@pytest.mark.django_db(transaction=True)
def test_get_docs_by_type_missmatching_type(db_session: Session, make_document_receipt):
    """
    `db.get_docs_by_type` must return ONLY documents of the specificified type

    In this scenario we have two document types:

    1. Groceries with two documents
    2. Bill without any document

    If we request documents of type "Bill" - no documents should be returned.

    In order to reproduce (very subtle) bug, in this scenario "Bill" document
    type shares at least one custom field with "Groceries".
    Bug is (was?) that if "Bill" and "Groceries" share at least one custom field
    then querying for "Bill" type documents returned documents of type
    "Groceries"
    """
    # create two docs of type 'Groceries'
    doc_1: Document = make_document_receipt(title="receipt_1.pdf")
    make_document_receipt(title="receipt_2.pdf")
    user_id = doc_1.user.id
    groceries_type_id = doc_1.document_type.id

    # to reproduce the bug bill document type should share at least one
    # custom field with Groceries
    stmt = select(CustomField.id).where(
        CustomField.name.in_(["Total", "EffectiveDate"])
    )
    custom_field_ids = list([row.id for row in db_session.execute(stmt)])
    billType = db_dtype_api.create_document_type(
        db_session,
        name="Bill",
        custom_field_ids=custom_field_ids,
        user_id=user_id,
    )

    billDocs: list[schemas.DocumentCFV] = db.get_docs_by_type(
        db_session,
        type_id=billType.id,
        user_id=user_id,
    )
    groceriesDocs: list[schemas.DocumentCFV] = db.get_docs_by_type(
        db_session, type_id=groceries_type_id, user_id=user_id
    )

    # because there are no documents of type "Bill"
    assert len(billDocs) == 0
    # because there are exactly two documents of type "Groceries"
    assert len(groceriesDocs) == 2


@pytest.mark.django_db(transaction=True)
def test_get_docs_by_type_order_by_cfv(db_session: Session, make_document_receipt):
    """
    `db.get_docs_by_type` with order by parameter
    """
    doc_1: Document = make_document_receipt(title="receipt_1.pdf")
    doc_2 = make_document_receipt(title="receipt_2.pdf")
    doc_3 = make_document_receipt(title="receipt_3.pdf")

    user_id = doc_1.user.id
    type_id = doc_1.document_type.id

    input_data = [
        {
            "document_id": doc_1.id,
            "custom_fields": {
                "Shop": "rewe",
                "EffectiveDate": "2024-07-01",
                "Total": "34",
            },
        },
        {
            "document_id": doc_2.id,
            "custom_fields": {
                "Shop": "rewe",
                "EffectiveDate": "2024-10-15",
                "Total": "15.63",
            },
        },
        {
            "document_id": doc_3.id,
            "custom_fields": {
                "Shop": "lidl",
                "EffectiveDate": "2024-02-25",
                "Total": "18.63",
            },
        },
    ]
    for data in input_data:
        db.update_doc_cfv(
            db_session,
            document_id=data["document_id"],
            custom_fields=data["custom_fields"],
        )

    # sort data by "EffectiveDate" in descending order
    items: list[schemas.DocumentCFV] = db.get_docs_by_type(
        db_session,
        type_id=type_id,
        user_id=user_id,
        order_by="EffectiveDate",  # !!! EffectiveDate !!!
        order=OrderEnum.desc,  # !!! DESC !!!
    )

    assert len(items) == 3

    results_eff_date_desc = []
    for i in range(0, 3):
        # !!! EffectiveDate !!!
        cf = dict([(y[0], y[1]) for y in items[i].custom_fields])
        results_eff_date_desc.append(cf["EffectiveDate"])

    # !!! EffectiveDate DESC !!!
    assert results_eff_date_desc == [
        Date(2024, 10, 15),
        Date(2024, 7, 1),
        Date(2024, 2, 25),
    ]

    # sort data by "EffectiveDate" in ASC order
    items: list[schemas.DocumentCFV] = db.get_docs_by_type(
        db_session,
        type_id=type_id,
        user_id=user_id,
        order_by="EffectiveDate",  #  !!! EffectiveDate !!!
        order=OrderEnum.asc,  # !!! ASC !!!
    )

    results_eff_date_asc = []
    for i in range(0, 3):
        #  !!! EffectiveDate !!!
        cf = dict([(y[0], y[1]) for y in items[i].custom_fields])
        results_eff_date_asc.append(cf["EffectiveDate"])

    # !!! ASC !!!
    assert results_eff_date_asc == [
        Date(2024, 2, 25),
        Date(2024, 7, 1),
        Date(2024, 10, 15),
    ]

    # sort data by "Total" in DESC order
    items: list[schemas.DocumentCFV] = db.get_docs_by_type(
        db_session,
        type_id=type_id,
        user_id=user_id,
        order_by="Total",  #  !!! Total !!!
        order=OrderEnum.desc,  # !!! desc !!!
    )

    results_total_desc = []
    for i in range(0, 3):
        #  !!! Total !!!
        cf = dict([(y[0], y[1]) for y in items[i].custom_fields])
        results_total_desc.append(cf["Total"])

    # !!! DESC !!!
    assert results_total_desc == [
        34,
        18.63,
        15.63,
    ]

    # sort data by "Total" in ASC order
    items: list[schemas.DocumentCFV] = db.get_docs_by_type(
        db_session,
        type_id=type_id,
        user_id=user_id,
        order_by="Total",  #  !!! Total !!!
        order=OrderEnum.asc,  # !!! ASC !!!
    )

    results_total_asc = []
    for i in range(0, 3):
        #  !!! Total !!!
        cf = dict([(y[0], y[1]) for y in items[i].custom_fields])
        results_total_asc.append(cf["Total"])

    # !!! ASC !!!
    assert results_total_asc == [
        15.63,
        18.63,
        34,
    ]


@pytest.mark.django_db(transaction=True)
def test_document_type_cf_count_1(db_session: Session, user: User, make_custom_field):
    cf1 = make_custom_field(
        name="some-random-cf1", type=schemas.CustomFieldType.boolean
    )
    cf2 = make_custom_field(
        name="some-random-cf2", type=schemas.CustomFieldType.boolean
    )

    dtype1 = db_dtype_api.create_document_type(
        db_session,
        name="document_type_1",
        custom_field_ids=[cf1.id, cf2.id],
        user_id=user.id,
    )

    assert (
        db_dtype_api.document_type_cf_count(db_session, document_type_id=dtype1.id) == 2
    )


@pytest.mark.django_db(transaction=True)
def test_document_type_cf_count_without_cf(db_session: Session, user: User):
    # document type does not have any custom field associated
    dtype1 = db_dtype_api.create_document_type(
        db_session,
        name="document_type_1",
        user_id=user.id,
    )

    actual_cf_count = db_dtype_api.document_type_cf_count(
        db_session, document_type_id=dtype1.id
    )
    assert actual_cf_count == 0


@pytest.mark.django_db(transaction=True)
def test_get_docs_count_by_type(db_session, user: User):
    """
    1. Create document type which does not have any document associated
    2. Expected result should be that number of the documents in this
    type is 0
    """
    dtype1 = db_dtype_api.create_document_type(
        db_session,
        name="document_type_1",
        user_id=user.id,
    )
    docs_count = db.get_docs_count_by_type(db_session, type_id=dtype1.id)
    # there are no documents of type "document_type_1" yet
    assert docs_count == 0


@pytest.mark.django_db(transaction=True)
def test_get_docs_count_by_type_with_two_document(db_session, user: User):
    """
    Create document type which has two documents associated
    and validate that `db.get_docs_count_by_type` returns 2
    """
    DOCS_COUNT = 2
    dtype = db_dtype_api.create_document_type(
        db_session,
        name="document_type_1",
        user_id=user.id,
    )
    for idx in range(0, DOCS_COUNT):
        document_recipe.make(
            user=user,
            title=f"Document {idx}",
            parent=user.home_folder,
            document_type_id=dtype.id,
        )

    docs_count = db.get_docs_count_by_type(db_session, type_id=dtype.id)
    # there are two documents in this category
    assert docs_count == DOCS_COUNT


def test_str2date():
    assert str2date("2024-10-30") == datetime(2024, 10, 30).date()
    assert str2date("2024-10-30 00:00:00") == datetime(2024, 10, 30).date()
