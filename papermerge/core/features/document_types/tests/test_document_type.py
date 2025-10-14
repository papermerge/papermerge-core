import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from papermerge.core.db.exceptions import DependenciesExist
from papermerge.core import dbapi, orm


async def test_on_delete_document_type_which_has_docs_associated(
    make_document_receipt, db_session: AsyncSession, user
):
    """
    If document type is deleted, then it's associated documents
    should stay (they, documents, will have doc.document_type_id set to NULL)
    """
    # Arrange
    doc: orm.Document = await make_document_receipt(
        title="receipt.pdf",
        user=user
    )

    with pytest.raises(DependenciesExist):
        await dbapi.delete_document_type(
            db_session,
            user_id=user.id,
            document_type_id=doc.document_type_id
        )
