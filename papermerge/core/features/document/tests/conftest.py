import uuid

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from papermerge.core import orm


@pytest.fixture
def make_document_zdf(db_session: AsyncSession, document_type_zdf):
    async def _make_receipt(title: str, user: orm.User):
        doc = orm.Document(
            id=uuid.uuid4(),
            ctype="document",
            title=title,
            user=user,
            document_type_id=document_type_zdf.id,
            parent_id=user.home_folder_id,
        )

        db_session.add(doc)

        await db_session.commit()

        return doc

    return _make_receipt
