import io
import os
import shutil
from pathlib import Path
from unittest.mock import patch

import pytest
from django.db import transaction
from django.db.utils import IntegrityError
from django.utils.datetime_safe import datetime
from sqlalchemy.orm import Session

from papermerge.core import db, schemas
from papermerge.core.db.doc import str2date
from papermerge.core.models import Document, User
from papermerge.core.storage import abs_path
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
def test_document_add_custom_field_values(
    db_session: Session,
    document: Document,
    document_type_with_two_integer_cf: schemas.DocumentType,
):
    total_cfv_after = db.get_document_custom_field_values(
        db_session, id=document.id, user_id=document.user.id
    )
    assert len(total_cfv_after) == 0

    dtype = document_type_with_two_integer_cf
    cf_add = {
        "document_type_id": dtype.id,
        "custom_fields": [
            {"custom_field_id": dtype.custom_fields[0].id, "value": "100"},
            {"custom_field_id": dtype.custom_fields[1].id, "value": "200"},
        ],
    }
    custom_fields_add = schemas.DocumentCustomFieldsAdd(**cf_add)
    db.add_document_custom_field_values(
        db_session,
        id=document.id,
        custom_fields_add=custom_fields_add,
        user_id=document.user.id,
    )

    total_cfv_after = db.get_document_custom_field_values(
        db_session, id=document.id, user_id=document.user.id
    )
    # two custom field values were created
    assert len(total_cfv_after) == 2

    fresh_doc = db.get_doc(db_session, document.id, document.user.id)
    # document type should have been updated to the dtype
    assert fresh_doc.document_type_id == dtype.id


@pytest.mark.django_db(transaction=True)
def test_document_add_custom_field_value_of_type_date(
    db_session: Session,
    document: Document,
    document_type_with_one_date_cf: schemas.DocumentType,
):
    """
    Custom field of type `date` is set to string "2024-10-28"
    """
    total_cfv_after = db.get_document_custom_field_values(
        db_session, id=document.id, user_id=document.user.id
    )
    assert len(total_cfv_after) == 0

    dtype = document_type_with_one_date_cf
    cf_add = {
        "document_type_id": dtype.id,
        "custom_fields": [
            # date is expected to be in:
            # papermerge.core.constants.INCOMING_DATE_FORMAT
            {"custom_field_id": dtype.custom_fields[0].id, "value": "2024-10-28"},
        ],
    }
    custom_fields_add = schemas.DocumentCustomFieldsAdd(**cf_add)
    db.add_document_custom_field_values(
        db_session,
        id=document.id,
        custom_fields_add=custom_fields_add,
        user_id=document.user.id,
    )

    total_cfv_after = db.get_document_custom_field_values(
        db_session, id=document.id, user_id=document.user.id
    )
    # one custom field value was created
    assert len(total_cfv_after) == 1


@pytest.mark.django_db(transaction=True)
def test_document_update_custom_field_of_type_date1(
    db_session: Session,
    document: Document,
    document_type_with_one_date_cf: schemas.DocumentType,
):
    dtype = document_type_with_one_date_cf
    cf_add = {
        "document_type_id": dtype.id,
        "custom_fields": [
            # date is expected to be in:
            # papermerge.core.constants.INCOMING_DATE_FORMAT
            {"custom_field_id": dtype.custom_fields[0].id, "value": "2024-10-28"},
        ],
    }
    custom_fields_add = schemas.DocumentCustomFieldsAdd(**cf_add)
    db.add_document_custom_field_values(
        db_session,
        id=document.id,
        custom_fields_add=custom_fields_add,
        user_id=document.user.id,
    )

    total_cfv_after1: list[schemas.CustomFieldValue] = (
        db.get_document_custom_field_values(
            db_session, id=document.id, user_id=document.user.id
        )
    )
    assert len(total_cfv_after1) == 1

    cf_update = {
        "document_type_id": dtype.id,
        "custom_fields": [
            {
                "custom_field_value_id": total_cfv_after1[0].id,
                "value": "2024-02-28 00:00:00",
            },
        ],
    }
    custom_fields_update = schemas.DocumentCustomFieldsUpdate(**cf_update)

    db.update_document_custom_field_values(
        db_session,
        id=document.id,
        custom_fields_update=custom_fields_update,
        user_id=document.user.id,
    )

    total_cfv_after2 = db.get_document_custom_field_values(
        db_session, id=document.id, user_id=document.user.id
    )
    # even though we update multiple times - only the value is
    # updated - and number of custom fields associated with
    # the document is the same i.e. - one
    assert len(total_cfv_after2) == 1
    # and the value is - last one
    assert total_cfv_after2[0].value == "2024-02-28 00:00:00"


@pytest.mark.django_db(transaction=True)
def test_document_update_same_custom_field_value_multiple_times1(
    db_session: Session,
    document: Document,
    document_type_with_one_date_cf: schemas.DocumentType,
):
    """
    There should be no problem updating custom field value multiple times
    """
    dtype = document_type_with_one_date_cf
    cf_add = {
        "document_type_id": dtype.id,
        "custom_fields": [
            # date is expected to be in:
            # papermerge.core.constants.INCOMING_DATE_FORMAT
            {"custom_field_id": dtype.custom_fields[0].id, "value": "2024-10-28"},
        ],
    }
    custom_fields_add = schemas.DocumentCustomFieldsAdd(**cf_add)
    db.add_document_custom_field_values(
        db_session,
        id=document.id,
        custom_fields_add=custom_fields_add,
        user_id=document.user.id,
    )

    total_cfv_after1: list[schemas.CustomFieldValue] = (
        db.get_document_custom_field_values(
            db_session, id=document.id, user_id=document.user.id
        )
    )
    assert len(total_cfv_after1) == 1

    # date is expected to be in:
    # papermerge.core.constants.INCOMING_DATE_FORMAT
    for value in ["2024-10-29", "2024-10-30"]:
        # updating same custom field multiple times should not raise
        # exceptions
        cf_update = {
            "document_type_id": dtype.id,
            "custom_fields": [
                {"custom_field_value_id": total_cfv_after1[0].id, "value": value},
            ],
        }
        custom_fields_update = schemas.DocumentCustomFieldsUpdate(**cf_update)

        db.update_document_custom_field_values(
            db_session,
            id=document.id,
            custom_fields_update=custom_fields_update,
            user_id=document.user.id,
        )

    total_cfv_after2 = db.get_document_custom_field_values(
        db_session, id=document.id, user_id=document.user.id
    )
    # even though we update multiple times - only the value is
    # updated - and number of custom fields associated with
    # the document is the same i.e. - one
    assert len(total_cfv_after2) == 1
    # and the value is - last one
    assert total_cfv_after2[0].value == "2024-10-30 00:00:00"


@pytest.mark.django_db(transaction=True)
def test_document_update_same_custom_field_value_multiple_times2(
    db_session: Session,
    document: Document,
    document_type_with_one_date_cf: schemas.DocumentType,
):
    """
    Every time custom field value is updated the retrieved value
    is the latest one
    """
    dtype = document_type_with_one_date_cf
    cf_add = {
        "document_type_id": dtype.id,
        "custom_fields": [
            {"custom_field_id": dtype.custom_fields[0].id, "value": "2024-10-28"},
        ],
    }
    custom_fields_add = schemas.DocumentCustomFieldsAdd(**cf_add)
    db.add_document_custom_field_values(
        db_session,
        id=document.id,
        custom_fields_add=custom_fields_add,
        user_id=document.user.id,
    )

    total_cfv_after1: list[schemas.CustomFieldValue] = (
        db.get_document_custom_field_values(
            db_session, id=document.id, user_id=document.user.id
        )
    )
    assert len(total_cfv_after1) == 1

    assert total_cfv_after1[0].value == "2024-10-28 00:00:00"

    cf_update = {
        "document_type_id": dtype.id,
        "custom_fields": [
            {"custom_field_value_id": total_cfv_after1[0].id, "value": "2024-10-29"},
        ],
    }
    custom_fields_update = schemas.DocumentCustomFieldsUpdate(**cf_update)
    # update it again
    db.update_document_custom_field_values(
        db_session,
        id=document.id,
        custom_fields_update=custom_fields_update,
        user_id=document.user.id,
    )

    total_cfv_after = db.get_document_custom_field_values(
        db_session, id=document.id, user_id=document.user.id
    )

    assert len(total_cfv_after) == 1
    # and make sure the retrieved value is
    # the latest one i.e. 29th of oct instead of 28th of oct
    assert total_cfv_after[0].value == "2024-10-29 00:00:00"


@pytest.mark.django_db(transaction=True)
def test_document_update_string_custom_field_value_multiple_times(
    db_session: Session,
    document: Document,
    document_type_with_one_string_cf: schemas.DocumentType,
):
    """
    Every time custom field value is updated the retrieved value
    is the latest one
    """
    dtype = document_type_with_one_string_cf
    cf_add = {
        "document_type_id": dtype.id,
        "custom_fields": [
            {"custom_field_id": dtype.custom_fields[0].id, "value": "smb 1"},
        ],
    }
    custom_fields_add = schemas.DocumentCustomFieldsAdd(**cf_add)
    db.add_document_custom_field_values(
        db_session,
        id=document.id,
        custom_fields_add=custom_fields_add,
        user_id=document.user.id,
    )

    total_cfv_after1: list[schemas.CustomFieldValue] = (
        db.get_document_custom_field_values(
            db_session, id=document.id, user_id=document.user.id
        )
    )
    assert len(total_cfv_after1) == 1

    assert total_cfv_after1[0].value == "smb 1"

    cf_update = {
        "document_type_id": dtype.id,
        "custom_fields": [
            {"custom_field_value_id": total_cfv_after1[0].id, "value": "smb 2"},
        ],
    }
    custom_fields_update = schemas.DocumentCustomFieldsUpdate(**cf_update)
    # update it again
    db.update_document_custom_field_values(
        db_session,
        id=document.id,
        custom_fields_update=custom_fields_update,
        user_id=document.user.id,
    )

    total_cfv_after = db.get_document_custom_field_values(
        db_session, id=document.id, user_id=document.user.id
    )

    assert len(total_cfv_after) == 1
    # and make sure the retrieved value is
    # the latest one i.e. "smb 2" instead of "smb 1"
    assert total_cfv_after[0].value == "smb 2"


@pytest.mark.django_db(transaction=True)
def test_document_update_document_type_to_none(
    db_session: Session,
    document: Document,
    document_type_with_one_string_cf: schemas.DocumentType,
):
    """
    when `document_type_id` is set to None - document type will
    be updated to None
    """
    dtype = document_type_with_one_string_cf
    cf_add = {
        "document_type_id": dtype.id,
        "custom_fields": [
            {"custom_field_id": dtype.custom_fields[0].id, "value": "smb 1"},
        ],
    }
    custom_fields_add = schemas.DocumentCustomFieldsAdd(**cf_add)
    db.add_document_custom_field_values(
        db_session,
        id=document.id,
        custom_fields_add=custom_fields_add,
        user_id=document.user.id,
    )

    total_cfv_after1: list[schemas.CustomFieldValue] = (
        db.get_document_custom_field_values(
            db_session, id=document.id, user_id=document.user.id
        )
    )
    assert len(total_cfv_after1) == 1

    assert total_cfv_after1[0].value == "smb 1"

    custom_fields_update = schemas.DocumentCustomFieldsUpdate(
        document_type_id=None, custom_fields=[]
    )
    db.update_document_custom_field_values(
        db_session,
        id=document.id,
        custom_fields_update=custom_fields_update,
        user_id=document.user.id,
    )

    total_cfv_after = db.get_document_custom_field_values(
        db_session, id=document.id, user_id=document.user.id
    )

    assert len(total_cfv_after) == 0


@pytest.mark.django_db(transaction=True)
def test_document_set_document_type_to_none(
    db_session: Session,
    document: Document,
    document_type_with_one_string_cf: schemas.DocumentType,
):
    """
    when `document_type_id` is set to None - document type will
    be updated to None
    """
    dtype = document_type_with_one_string_cf
    cf_add = {
        "document_type_id": dtype.id,
        "custom_fields": [
            {"custom_field_id": dtype.custom_fields[0].id, "value": "smb 1"},
        ],
    }
    custom_fields_add = schemas.DocumentCustomFieldsAdd(**cf_add)
    db.add_document_custom_field_values(
        db_session,
        id=document.id,
        custom_fields_add=custom_fields_add,
        user_id=document.user.id,
    )

    total_cfv_after1: list[schemas.CustomFieldValue] = (
        db.get_document_custom_field_values(
            db_session, id=document.id, user_id=document.user.id
        )
    )
    assert len(total_cfv_after1) == 1

    assert total_cfv_after1[0].value == "smb 1"

    custom_fields_add = schemas.DocumentCustomFieldsAdd(
        document_type_id=None, custom_fields=[]
    )
    db.add_document_custom_field_values(
        db_session,
        id=document.id,
        custom_fields_add=custom_fields_add,
        user_id=document.user.id,
    )

    total_cfv_after = db.get_document_custom_field_values(
        db_session, id=document.id, user_id=document.user.id
    )

    assert len(total_cfv_after) == 0


def test_str2date():
    assert str2date("2024-10-30") == datetime(2024, 10, 30).date()
    assert str2date("2024-10-30 00:00:00") == datetime(2024, 10, 30).date()
