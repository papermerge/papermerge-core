import uuid

import pytest

from papermerge.core.db.engine import Session
from papermerge.core import orm


@pytest.fixture
def make_document_zdf(db_session: Session, document_type_zdf):
    def _make_receipt(title: str, user: orm.User):
        doc = orm.Document(
            id=uuid.uuid4(),
            ctype="document",
            title=title,
            user=user,
            document_type_id=document_type_zdf.id,
            parent_id=user.home_folder_id,
        )

        db_session.add(doc)

        db_session.commit()

        return doc

    return _make_receipt
