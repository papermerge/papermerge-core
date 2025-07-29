from sqlalchemy.ext.asyncio import AsyncSession
from papermerge.core import dbapi

async def test_get_doc_versions_list_one_doc(
    db_session: AsyncSession, make_document, user
):
    doc = await make_document(title="basic.pdf", user=user, parent=user.home_folder)
    vers = await dbapi.get_doc_versions_list(db_session, doc.id)

    assert len(vers) == 1
    assert vers[0].number == 1


async def test_get_doc_versions_list_two_docs(
    db_session: AsyncSession, make_document, user
):
    doc = await make_document(title="basic.pdf", user=user, parent=user.home_folder)
    await dbapi.version_bump(db_session, doc_id=doc.id, user_id=user.id, page_count=3)

    vers = await dbapi.get_doc_versions_list(db_session, doc.id)

    assert len(vers) == 2
    assert [2, 1] == [vers[0].number, vers[1].number]
