import uuid
import pytest

from sqlalchemy import select, func

from papermerge.core import orm
from papermerge.core.features.nodes.db import api as dbapi
from papermerge.core.features.document.db import api as docs_dbapi


def test_get_descendants(make_folder, make_document, db_session, user):

    mydocs_folder = make_folder(
        title="My Documents", parent=user.home_folder, user=user
    )
    invoice = make_document(
        title="invoice.pdf",
        user=user,
        parent=mydocs_folder,
    )
    nested_folder = make_folder(title="Nested Folder", parent=mydocs_folder, user=user)

    doc1 = make_document(
        title="doc1.pdf",
        user=user,
        parent=nested_folder,
    )

    doc2 = make_document(
        title="doc2.pdf",
        user=user,
        parent=nested_folder,
    )

    actual_descendants = {
        item[0]
        for item in dbapi.get_descendants(db_session, node_ids=[mydocs_folder.id])
    }  # ids

    expected_descendants = {
        invoice.id,
        mydocs_folder.id,
        doc1.id,
        doc2.id,
        nested_folder.id,
    }  # ids

    assert expected_descendants == actual_descendants


def test_get_descendants_include_self(make_folder, make_document, db_session, user):

    mydocs_folder = make_folder(
        title="My Documents", parent=user.home_folder, user=user
    )
    invoice = make_document(
        title="invoice.pdf",
        user=user,
        parent=mydocs_folder,
    )

    found_ids = {
        item[0]
        for item in dbapi.get_descendants(db_session, node_ids=[mydocs_folder.id])
    }

    assert invoice.id in found_ids
    assert mydocs_folder.id in found_ids
    assert len(found_ids) == 2


def test_get_descendants_without_self(make_folder, make_document, db_session, user):

    mydocs_folder = make_folder(
        title="My Documents", parent=user.home_folder, user=user
    )
    invoice = make_document(
        title="invoice.pdf",
        user=user,
        parent=mydocs_folder,
    )

    found_ids = {
        item[0]
        for item in dbapi.get_descendants(
            db_session, node_ids=[mydocs_folder.id], include_selfs=False
        )
    }

    # result SHOULD NOT include "My documents" folder
    assert invoice.id in found_ids
    assert len(found_ids) == 1


def test_get_descendants_garbage_input(db_session):
    with pytest.raises(ValueError):
        dbapi.get_descendants(db_session, "bla")

    with pytest.raises(ValueError):
        dbapi.get_descendants(db_session, uuid.uuid4())

    with pytest.raises(ValueError):
        dbapi.get_descendants(db_session, [])


def test_delete_document_which_has_custom_fields(
    db_session, make_document_receipt, user
):
    """User should be able to delete documents which have associated
    custom fields values

    Also document deletion must "take away" also its custom fields i.e.
    document custom fields must be deleted as well
    """

    # Arrange
    receipt = make_document_receipt(title="receipt-1.pdf", user=user)
    doc_count_before = db_session.execute(
        select(func.count(orm.Document.id)).where(orm.Document.title == "receipt-1.pdf")
    ).scalar()

    assert doc_count_before == 1

    # set initial CFVs
    cf = {"EffectiveDate": "2024-09-26", "Shop": "Aldi", "Total": "32.97"}

    docs_dbapi.update_doc_cfv(
        db_session,
        document_id=receipt.id,
        custom_fields=cf,
    )

    # Act
    error = dbapi.delete_nodes(db_session, node_ids=[receipt.id], user_id=user.id)

    # Assert
    assert error is None, error.model_dump()
    doc_count_after = db_session.execute(
        select(func.count(orm.Document.id)).where(orm.Document.title == "receipt-1.pdf")
    ).scalar()
    cfv_count = db_session.execute(select(func.count(orm.CustomFieldValue.id))).scalar()

    # document was deleted
    assert doc_count_after == 0
    # its custom fields must be deleted as well
    assert cfv_count == 0


def test_delete_recursively_documents_which_has_custom_fields(
    db_session, make_document_receipt, make_folder, user
):
    """User should be able to delete documents which have associated
    custom fields values. In this scenario documents to be
    deleted a placed inside a folder "My Documents". User
    deletes actually folder "My Documents". The effect is
    expected to be deletion of all documents inside that folder
    altogether with their associated custom field values.
    """

    # Arrange
    my_folder = make_folder(title="My Documents", parent=user.home_folder, user=user)
    receipt1 = make_document_receipt(title="receipt-1.pdf", user=user, parent=my_folder)
    receipt2 = make_document_receipt(title="receipt-2.pdf", user=user, parent=my_folder)

    doc_count_before = db_session.execute(
        select(func.count(orm.Document.id)).where(
            orm.Document.title.in_(["receipt-1.pdf", "receipt-2.pdf"])
        )
    ).scalar()

    assert doc_count_before == 2

    # set initial CFVs
    cf = {"EffectiveDate": "2024-09-26", "Shop": "Aldi", "Total": "32.97"}

    docs_dbapi.update_doc_cfv(
        db_session,
        document_id=receipt1.id,
        custom_fields=cf,
    )

    docs_dbapi.update_doc_cfv(
        db_session,
        document_id=receipt2.id,
        custom_fields=cf,
    )

    # Act
    error = dbapi.delete_nodes(db_session, node_ids=[my_folder.id], user_id=user.id)

    # Assert
    assert error is None, error.model_dump()
    doc_count_after = db_session.execute(
        select(func.count(orm.Document.id)).where(
            orm.Document.title.in_(["receipt-1.pdf", "receipt-2.pdf"])
        )
    ).scalar()
    cfv_count = db_session.execute(select(func.count(orm.CustomFieldValue.id))).scalar()

    # document was deleted
    assert doc_count_after == 0
    # its custom fields must be deleted as well
    assert cfv_count == 0


def test_delete_folder_recursively_with_its_content(
    db_session, make_document, make_folder, user
):
    """
    User must be able to delete folder with its content.
    If user deletes a folder - all folder descendants (other folders and documents)
    must be deleted as well.
    """
    # Arrange
    my_folder = make_folder(title="My Documents", parent=user.home_folder, user=user)
    make_document(title="doc-1.pdf", user=user, parent=my_folder)
    make_document(title="doc-2.pdf", user=user, parent=my_folder)

    doc_count_before = db_session.execute(
        select(func.count(orm.Document.id)).where(
            orm.Document.title.in_(["doc-1.pdf", "doc-2.pdf"])
        )
    ).scalar()

    assert doc_count_before == 2

    # Act
    error = dbapi.delete_nodes(db_session, node_ids=[my_folder.id], user_id=user.id)

    # Assert
    assert error is None, error.model_dump()

    doc_count_after = db_session.execute(
        select(func.count(orm.Document.id)).where(
            orm.Document.title.in_(["doc-1.pdf", "doc-2.pdf"])
        )
    ).scalar()

    assert doc_count_after == 0
