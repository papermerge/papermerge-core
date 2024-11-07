import uuid

import pytest

from papermerge.core.db.engine import Session
from papermerge.core import orm


@pytest.fixture
def make_document_receipt(db_session: Session, user, document_type_groceries):
    def _make_receipt(title: str):
        doc_id = uuid.uuid4()
        doc = orm.Document(
            id=doc_id,
            ctype="document",
            title=title,
            user_id=user.id,
            document_type_id=document_type_groceries.id,
            parent_id=user.home_folder_id,
            lang="de",
        )

        db_session.add(doc)

        db_session.commit()

        return doc

    return _make_receipt
