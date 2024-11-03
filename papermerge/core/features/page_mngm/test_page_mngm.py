from papermerge.core.features.page_mngm.db import api as page_mngm_dbapi
from papermerge.core.features.document.db import api as doc_dbapi


def test_copy_text_field(db_session, make_document_version, user):
    doc_ver_x = make_document_version(
        page_count=2, pages_text=["some", "body"], user=user
    )
    doc_ver_y = make_document_version(page_count=1, user=user)

    page_mngm_dbapi.copy_text_field(
        db_session, src=doc_ver_x, dst=doc_ver_y, page_numbers=[2]
    )

    doc_ver = doc_dbapi.get_doc_ver(db_session, id=doc_ver_y.id, user_id=user.id)

    assert doc_ver.pages[0].text == "body"


def test_apply_pages_op(): ...
