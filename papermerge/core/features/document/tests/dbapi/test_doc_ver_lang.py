import uuid

import pytest
from sqlalchemy.exc import NoResultFound
from sqlalchemy.ext.asyncio import AsyncSession

from papermerge.core.schema import DocumentLang
from papermerge.core.features.document.db import api as dbapi


async def test_get_doc_ver_lang(
    make_document_version,
    user,
    db_session: AsyncSession
):
    """Test getting lang attribute of a document version"""
    doc_ver = await make_document_version(
        page_count=2,
        lang=DocumentLang.fra,
        user=user
    )

    lang = await dbapi.get_doc_ver_lang(db_session, doc_ver_id=doc_ver.id)

    assert lang == "fra"


async def test_get_doc_ver_lang_default(
    make_document_version,
    user,
    db_session: AsyncSession
):
    """Test getting lang attribute when default value is used"""
    # Default lang is "deu"
    doc_ver = await make_document_version(page_count=1, user=user)

    lang = await dbapi.get_doc_ver_lang(db_session, doc_ver_id=doc_ver.id)

    assert lang == "deu"


async def test_get_doc_ver_lang_non_existing(db_session: AsyncSession):
    """Test getting lang attribute for non-existing document version raises NoResultFound"""
    non_existing_id = uuid.uuid4()

    with pytest.raises(NoResultFound):
        await dbapi.get_doc_ver_lang(db_session, doc_ver_id=non_existing_id)


async def test_set_doc_ver_lang(
    make_document_version,
    user,
    db_session: AsyncSession
):
    """Test setting lang attribute of a document version"""
    doc_ver = await make_document_version(page_count=2, lang=DocumentLang.deu, user=user)

    result = await dbapi.set_doc_ver_lang(
        db_session,
        doc_ver_id=doc_ver.id,
        lang=DocumentLang.eng,
        updated_by=user.id
    )

    assert result == "eng"


async def test_set_doc_ver_lang_verify_persistence(
    make_document_version,
    user,
    db_session: AsyncSession
):
    """Test that setting lang attribute persists the change"""
    doc_ver = await make_document_version(page_count=2, lang=DocumentLang.deu, user=user)

    await dbapi.set_doc_ver_lang(
        db_session,
        doc_ver_id=doc_ver.id,
        lang=DocumentLang.ron,
        updated_by=user.id
    )

    # Verify by getting it
    lang = await dbapi.get_doc_ver_lang(db_session, doc_ver_id=doc_ver.id)
    assert lang == DocumentLang.ron


async def test_set_doc_ver_lang_non_existing(db_session: AsyncSession, system_user):
    """Test setting lang attribute for non-existing document version raises NoResultFound"""
    non_existing_id = uuid.uuid4()

    with pytest.raises(NoResultFound):
        await dbapi.set_doc_ver_lang(
            db_session,
            doc_ver_id=non_existing_id,
            lang=DocumentLang.eng,
            updated_by=system_user.id
        )


async def test_set_doc_ver_lang_multiple_times(
    make_document_version,
    user,
    db_session: AsyncSession
):
    """Test setting lang attribute multiple times"""
    doc_ver = await make_document_version(page_count=1, lang=DocumentLang.deu, user=user)

    # Set to eng
    await dbapi.set_doc_ver_lang(
        db_session,
        doc_ver_id=doc_ver.id,
        lang=DocumentLang.eng,
        updated_by=user.id
    )

    lang = await dbapi.get_doc_ver_lang(db_session, doc_ver_id=doc_ver.id)
    assert lang == DocumentLang.eng

    # Set to fra
    await dbapi.set_doc_ver_lang(
        db_session,
        doc_ver_id=doc_ver.id,
        lang=DocumentLang.fra,
        updated_by=user.id
    )
    lang = await dbapi.get_doc_ver_lang(db_session, doc_ver_id=doc_ver.id)
    assert lang == DocumentLang.fra

    # Set to ron
    await dbapi.set_doc_ver_lang(
        db_session,
        doc_ver_id=doc_ver.id,
        lang=DocumentLang.ron,
        updated_by=user.id
    )
    lang = await dbapi.get_doc_ver_lang(db_session, doc_ver_id=doc_ver.id)
    assert lang == DocumentLang.ron
