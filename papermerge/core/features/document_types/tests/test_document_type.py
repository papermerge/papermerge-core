from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from papermerge.core import dbapi, orm


async def test_on_delete_document_type_which_has_docs_associated(
    make_document_receipt, db_session: AsyncSession, user
):
    """
    If document type is deleted, then it's associated documents
    should stay (they, documents, will have doc.document_type_id set to NULL)
    """
    # Arrange
    doc: orm.Document = await make_document_receipt(title="receipt.pdf", user=user)
    doc_type_id = doc.document_type_id

    # Act
    await dbapi.delete_document_type(db_session, doc.document_type_id)

    # Assert
    doc_count = (await db_session.execute(
        select(func.count(orm.Document.id)).where(orm.Document.id == doc.id)
    )).scalar()
    doc_type_count = (await db_session.execute(
        select(func.count(orm.DocumentType.id)).where(
            orm.DocumentType.id == doc_type_id
        )
    )).scalar()

    # document is still there
    assert doc_count == 1
    # document type was deleted indeed
    assert doc_type_count == 0
