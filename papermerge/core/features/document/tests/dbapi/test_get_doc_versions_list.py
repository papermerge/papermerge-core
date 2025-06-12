from papermerge.core import dbapi

def test_get_doc_versions_list_one_doc(
    db_session, make_document, user
):
    doc = make_document(title="basic.pdf", user=user, parent=user.home_folder)
    vers = dbapi.get_doc_versions_list(db_session, doc.id)

    assert len(vers) == 1
    assert vers[0].number == 1


def test_get_doc_versions_list_two_docs(
    db_session, make_document, user
):
    doc = make_document(title="basic.pdf", user=user, parent=user.home_folder)
    dbapi.version_bump(db_session, doc_id=doc.id, user_id=user.id, page_count=3)

    vers = dbapi.get_doc_versions_list(db_session, doc.id)

    assert len(vers) == 2
    assert [2, 1] == [vers[0].number, vers[1].number]
