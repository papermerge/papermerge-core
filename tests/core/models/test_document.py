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
from sqlalchemy import select
from sqlalchemy.orm import Session

from papermerge.core.features.custom_fields import schema as cf_schema
from papermerge.core.features.custom_fields.db import orm as cf_orm
from papermerge.core.features.document import schema as doc_schema
from papermerge.core.features.document.db import api as doc_dbapi
from papermerge.core.features.document_types import db as db_dtype_api
from papermerge.core.models import Document, User
from papermerge.core.storage import abs_path
from papermerge.core.types import OrderEnum
from papermerge.core.utils.misc import str2date
from papermerge.test.baker_recipes import document_recipe, folder_recipe, user_recipe
from papermerge.test.testcases import TestCase
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
    stmt = select(cf_orm.CustomField.id).where(
        cf_orm.CustomField.name.in_(["Total", "EffectiveDate"])
    )
    custom_field_ids = list([row.id for row in db_session.execute(stmt)])
    billType = db_dtype_api.create_document_type(
        db_session,
        name="Bill",
        custom_field_ids=custom_field_ids,
        user_id=user_id,
    )

    billDocs: list[doc_schema.DocumentCFV] = doc_dbapi.get_docs_by_type(
        db_session,
        type_id=billType.id,
        user_id=user_id,
    )
    groceriesDocs: list[doc_schema.DocumentCFV] = doc_dbapi.get_docs_by_type(
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
        doc_dbapi.update_doc_cfv(
            db_session,
            document_id=data["document_id"],
            custom_fields=data["custom_fields"],
        )

    # sort data by "EffectiveDate" in descending order
    items: list[doc_schema.DocumentCFV] = doc_dbapi.get_docs_by_type(
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
    items: list[doc_schema.DocumentCFV] = doc_dbapi.get_docs_by_type(
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
    items: list[doc_schema.DocumentCFV] = doc_dbapi.get_docs_by_type(
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
    items: list[doc_schema.DocumentCFV] = doc_dbapi.get_docs_by_type(
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
        name="some-random-cf1", type=cf_schema.CustomFieldType.boolean
    )
    cf2 = make_custom_field(
        name="some-random-cf2", type=cf_schema.CustomFieldType.boolean
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
    docs_count = doc_dbapi.get_docs_count_by_type(db_session, type_id=dtype1.id)
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

    docs_count = doc_dbapi.get_docs_count_by_type(db_session, type_id=dtype.id)
    # there are two documents in this category
    assert docs_count == DOCS_COUNT
