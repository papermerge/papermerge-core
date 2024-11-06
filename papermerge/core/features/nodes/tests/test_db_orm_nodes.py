import uuid
import pytest

from papermerge.core.features.nodes.db import api as dbapi


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
