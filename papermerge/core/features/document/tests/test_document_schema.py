from papermerge.core import schema


async def test_basic_document_version(make_document_version, user):
    """assert that document version instance can be validated
    via pydantic mode_validate"""
    db_doc_ver = await make_document_version(page_count=2, lang="fra", user=user)

    doc_ver = schema.DocumentVersion.model_validate(db_doc_ver)

    assert doc_ver.number == 1
    assert doc_ver.size == 0
    assert doc_ver.lang == "fra"
    assert doc_ver.download_url


async def test_basic_document(make_document, user):
    doc = await make_document(
        title="invoice.pdf",
        lang="deu",
        user=user,
        parent=user.home_folder
    )

    assert doc.title == "invoice.pdf"
