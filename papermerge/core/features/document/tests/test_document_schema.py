from papermerge.core import schema


def test_basic_page(make_page):
    db_page = make_page()

    page = schema.Page.model_validate(db_page)

    assert page.jpg_url == f"/api/pages/{page.id}/jpg"
    assert page.svg_url == f"/api/pages/{page.id}/svg"


def test_basic_document_version(make_document_version, user):
    """assert that document version instance can be validated
    via pydantic mode_validate"""
    db_doc_ver = make_document_version(page_count=2, lang="fra", user=user)

    doc_ver = schema.DocumentVersion.model_validate(db_doc_ver)

    assert doc_ver.number == 1
    assert doc_ver.size == 0
    assert doc_ver.lang == "fra"
    assert doc_ver.download_url
