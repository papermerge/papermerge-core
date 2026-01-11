"""
Test document processing status fields

Run this after migration to verify everything works:
    pytest papermerge/core/features/document/tests/test_processing_status.py
"""
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from papermerge.core.features.document.db import orm
from papermerge.core.types import DocumentProcessingStatus, MimeType


async def test_document_processing_status_default(
        db_session: AsyncSession,
        make_document,
        user
):
    """Test that new documents have 'uploaded' status by default"""
    doc = await make_document(
        title="test.pdf",
        user=user,
        parent=user.home_folder
    )

    stmt = select(orm.Document).where(orm.Document.id == doc.id)
    result = await db_session.execute(stmt)
    fresh_doc = result.scalar_one()

    assert fresh_doc.processing_status == DocumentProcessingStatus.uploaded
    assert fresh_doc.processing_error is None


async def test_document_processing_status_properties(
        db_session: AsyncSession,
        make_document,
        user
):
    """Test helper properties on Document"""
    doc = await make_document(
        title="test.pdf",
        user=user,
        parent=user.home_folder
    )

    stmt = select(orm.Document).where(orm.Document.id == doc.id)
    result = await db_session.execute(stmt)
    fresh_doc = result.scalar_one()

    # Initially uploaded
    assert fresh_doc.processing_status == DocumentProcessingStatus.uploaded
    assert not fresh_doc.is_ready
    assert not fresh_doc.is_processing
    assert not fresh_doc.has_failed

    # Set to converting
    fresh_doc.processing_status = DocumentProcessingStatus.converting
    await db_session.commit()
    await db_session.refresh(fresh_doc)

    assert fresh_doc.is_processing
    assert not fresh_doc.is_ready

    # Set to ready
    fresh_doc.processing_status = DocumentProcessingStatus.ready
    await db_session.commit()
    await db_session.refresh(fresh_doc)

    assert fresh_doc.is_ready
    assert not fresh_doc.is_processing
    assert not fresh_doc.has_failed

    # Set to failed
    fresh_doc.processing_status = DocumentProcessingStatus.failed
    fresh_doc.processing_error = "Conversion failed"
    await db_session.commit()
    await db_session.refresh(fresh_doc)

    assert fresh_doc.has_failed
    assert fresh_doc.processing_error == "Conversion failed"


async def test_document_version_is_original(
        db_session: AsyncSession,
        make_document,
        user
):
    """Test that version 1 is marked as original"""
    doc = await make_document(
        title="test.pdf",
        user=user,
        parent=user.home_folder
    )

    # Get document with versions
    stmt = select(orm.Document).where(orm.Document.id == doc.id)
    result = await db_session.execute(stmt)
    fresh_doc = result.scalar_one()

    # Version 1 should be marked as original
    version_1 = fresh_doc.versions[0]
    assert version_1.is_original is True
    assert version_1.creation_reason == "upload"
    assert version_1.source_version_id is None


async def test_document_version_lineage(
        db_session: AsyncSession,
        make_document,
        user
):
    """Test version lineage with source_version_id"""

    # Create document
    doc = await make_document(
        title="test.pdf",
        user=user,
        parent=user.home_folder
    )

    # Get version 1
    stmt = select(orm.Document).where(orm.Document.id == doc.id)
    result = await db_session.execute(stmt)
    fresh_doc = result.scalar_one()
    version_1 = fresh_doc.versions[0]

    # Create version 2 (simulating conversion)
    version_2 = orm.DocumentVersion(
        document_id=doc.id,
        number=2,
        file_name="test.pdf",
        mime_type=MimeType.application_pdf,
        is_original=False,
        source_version_id=version_1.id,
        creation_reason="conversion",
        created_by=user.id,
        updated_by=user.id
    )
    db_session.add(version_2)
    await db_session.commit()
    await db_session.refresh(version_2)

    # Verify lineage
    assert version_2.source_version_id == version_1.id
    assert version_2.is_original is False
    assert version_2.creation_reason == "conversion"

    # Create version 3 (simulating page edit)
    version_3 = orm.DocumentVersion(
        document_id=doc.id,
        number=3,
        file_name="test.pdf",
        mime_type=MimeType.application_pdf,
        is_original=False,
        source_version_id=version_2.id,
        creation_reason="page_edit",
        created_by=user.id,
        updated_by=user.id
    )
    db_session.add(version_3)
    await db_session.commit()
    await db_session.refresh(version_3)

    # Verify lineage chain: v1 -> v2 -> v3
    assert version_3.source_version_id == version_2.id
    assert version_2.source_version_id == version_1.id
    assert version_1.source_version_id is None
