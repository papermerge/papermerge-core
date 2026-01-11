"""Tests for the POST /documents/upload API endpoint"""
import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from papermerge.core.features.nodes.db import api as nodes_dbapi
from papermerge.core.tests.types import AuthTestClient, DocumentTestFileType


async def test_upload_basic_pdf(
    auth_api_client: AuthTestClient,
    db_session: AsyncSession,
    pdf_file: DocumentTestFileType
):
    """Test basic PDF upload without optional parameters"""
    resp = await auth_api_client.post(
        "/documents/upload",
        files={"file": pdf_file.as_upload_tuple()}
    )

    assert resp.status_code == 201, resp.json()

    data = resp.json()
    assert "id" in data
    assert data["title"] == pdf_file.filename
    assert "processing_status" in data

    # Verify document was created in inbox
    inbox_folder_id = auth_api_client.user.inbox_folder_id
    nodes = await nodes_dbapi.get_paginated_nodes(
        db_session,
        parent_id=inbox_folder_id,
        page_size=10,
        page_number=1,
        sort_by="title",
        sort_direction="asc"
    )

    assert len(nodes.items) == 1
    assert nodes.items[0].title == pdf_file.filename


async def test_upload_with_custom_title(
    auth_api_client: AuthTestClient,
    db_session: AsyncSession,
    pdf_file: DocumentTestFileType
):
    """Test upload with custom title parameter"""
    custom_title = "My Custom Title.pdf"

    resp = await auth_api_client.post(
        "/documents/upload",
        files={"file": pdf_file.as_upload_tuple()},
        data={"title": custom_title}
    )

    assert resp.status_code == 201, resp.json()

    data = resp.json()
    assert data["title"] == custom_title

    # Verify in database
    inbox_folder_id = auth_api_client.user.inbox_folder_id
    nodes = await nodes_dbapi.get_paginated_nodes(
        db_session,
        parent_id=inbox_folder_id,
        page_size=10,
        page_number=1,
        sort_by="title",
        sort_direction="asc"
    )

    assert len(nodes.items) == 1
    assert nodes.items[0].title == custom_title


async def test_upload_to_specific_folder(
    auth_api_client: AuthTestClient,
    make_folder,
    db_session: AsyncSession,
    pdf_file: DocumentTestFileType
):
    """Test upload to a specific parent folder"""
    user = auth_api_client.user
    target_folder = await make_folder(
        title="Documents",
        user=user,
        parent=user.home_folder
    )

    resp = await auth_api_client.post(
        "/documents/upload",
        files={"file": pdf_file.as_upload_tuple()},
        data={"parent_id": str(target_folder.id)}
    )

    assert resp.status_code == 201, resp.json()

    # Verify document is in target folder
    nodes = await nodes_dbapi.get_paginated_nodes(
        db_session,
        parent_id=target_folder.id,
        page_size=10,
        page_number=1,
        sort_by="title",
        sort_direction="asc"
    )

    assert len(nodes.items) == 1
    assert nodes.items[0].title == pdf_file.filename


async def test_upload_with_custom_document_id(
    auth_api_client: AuthTestClient,
    db_session: AsyncSession,
    pdf_file: DocumentTestFileType
):
    """Test upload with custom document ID"""
    custom_id = uuid.uuid4()

    resp = await auth_api_client.post(
        "/documents/upload",
        files={"file": pdf_file.as_upload_tuple()},
        data={"document_id": str(custom_id)}
    )

    assert resp.status_code == 201, resp.json()

    data = resp.json()
    assert data["id"] == str(custom_id)


async def test_upload_with_ocr_enabled(
    auth_api_client: AuthTestClient,
    db_session: AsyncSession,
    pdf_file: DocumentTestFileType
):
    """Test upload with OCR parameter enabled"""
    resp = await auth_api_client.post(
        "/documents/upload",
        files={"file": pdf_file.as_upload_tuple()},
        data={"ocr": "true"}
    )

    assert resp.status_code == 201, resp.json()


async def test_upload_with_custom_language(
    auth_api_client: AuthTestClient,
    db_session: AsyncSession,
    pdf_file: DocumentTestFileType
):
    """Test upload with custom language parameter"""
    resp = await auth_api_client.post(
        "/documents/upload",
        files={"file": pdf_file.as_upload_tuple()},
        data={"lang": "fra"}
    )

    assert resp.status_code == 201, resp.json()


async def test_upload_with_all_parameters(
    auth_api_client: AuthTestClient,
    make_folder,
    db_session: AsyncSession,
    pdf_file: DocumentTestFileType
):
    """Test upload with all optional parameters"""
    user = auth_api_client.user
    target_folder = await make_folder(
        title="Archive",
        user=user,
        parent=user.home_folder
    )
    custom_id = uuid.uuid4()
    custom_title = "Annual Report.pdf"

    resp = await auth_api_client.post(
        "/documents/upload",
        files={"file": pdf_file.as_upload_tuple()},
        data={
            "document_id": str(custom_id),
            "title": custom_title,
            "parent_id": str(target_folder.id),
            "ocr": "true",
            "lang": "deu"
        }
    )

    assert resp.status_code == 201, resp.json()

    data = resp.json()
    assert data["id"] == str(custom_id)
    assert data["title"] == custom_title


async def test_upload_jpeg_file(
    auth_api_client: AuthTestClient,
    db_session: AsyncSession,
    jpeg_file: DocumentTestFileType
):
    """Test uploading a JPEG image file"""
    resp = await auth_api_client.post(
        "/documents/upload",
        files={"file": jpeg_file.as_upload_tuple()}
    )

    assert resp.status_code == 201, resp.json()

    data = resp.json()
    assert data["title"] == jpeg_file.filename


async def test_upload_png_file(
    auth_api_client: AuthTestClient,
    db_session: AsyncSession,
    png_file: DocumentTestFileType
):
    """Test uploading a PNG image file"""
    resp = await auth_api_client.post(
        "/documents/upload",
        files={"file": png_file.as_upload_tuple()}
    )

    assert resp.status_code == 201, resp.json()

    data = resp.json()
    assert data["title"] == png_file.filename


async def test_upload_tiff_file(
    auth_api_client: AuthTestClient,
    db_session: AsyncSession,
    tiff_file: DocumentTestFileType
):
    """Test uploading a TIFF image file"""
    resp = await auth_api_client.post(
        "/documents/upload",
        files={"file": tiff_file.as_upload_tuple()}
    )

    assert resp.status_code == 201, resp.json()

    data = resp.json()
    assert data["title"] == tiff_file.filename


async def test_upload_multi_page_pdf(
    auth_api_client: AuthTestClient,
    db_session: AsyncSession,
    multi_page_pdf_file: DocumentTestFileType
):
    """Test uploading a multi-page PDF"""
    resp = await auth_api_client.post(
        "/documents/upload",
        files={"file": multi_page_pdf_file.as_upload_tuple()}
    )

    assert resp.status_code == 201, resp.json()

    data = resp.json()
    assert data["title"] == multi_page_pdf_file.filename


async def test_upload_to_nonexistent_parent(
    auth_api_client: AuthTestClient,
    db_session: AsyncSession,
    pdf_file: DocumentTestFileType
):
    """Test upload to a non-existent parent folder returns 403"""
    fake_parent_id = uuid.uuid4()

    resp = await auth_api_client.post(
        "/documents/upload",
        files={"file": pdf_file.as_upload_tuple()},
        data={"parent_id": str(fake_parent_id)}
    )

    assert resp.status_code == 403, resp.json()


async def test_upload_to_folder_without_permission(
    auth_api_client: AuthTestClient,
    make_folder,
    make_user,
    db_session: AsyncSession,
    pdf_file: DocumentTestFileType
):
    """Test upload to a folder owned by another user fails"""
    # Create another user with their own folder
    other_user = await make_user(username="other_user")
    other_folder = await make_folder(
        title="Other User Folder",
        user=other_user,
        parent=other_user.home_folder
    )

    # Try to upload to other user's folder
    resp = await auth_api_client.post(
        "/documents/upload",
        files={"file": pdf_file.as_upload_tuple()},
        data={"parent_id": str(other_folder.id)}
    )

    assert resp.status_code == 403, resp.json()


async def test_upload_multiple_documents_with_same_name(
    auth_api_client: AuthTestClient,
    db_session: AsyncSession,
    pdf_file: DocumentTestFileType
):
    """Test that uploading multiple documents with same name is allowed"""
    # Upload first document
    resp1 = await auth_api_client.post(
        "/documents/upload",
        files={"file": pdf_file.as_upload_tuple()}
    )
    assert resp1.status_code == 201, resp1.json()

    # Upload second document with same filename
    resp2 = await auth_api_client.post(
        "/documents/upload",
        files={"file": pdf_file.as_upload_tuple()}
    )
    assert resp2.status_code == 201, resp2.json()

    # Verify both documents exist in inbox
    inbox_folder_id = auth_api_client.user.inbox_folder_id
    nodes = await nodes_dbapi.get_paginated_nodes(
        db_session,
        parent_id=inbox_folder_id,
        page_size=10,
        page_number=1,
        sort_by="title",
        sort_direction="asc"
    )

    assert len(nodes.items) == 2
    assert nodes.items[0].title == pdf_file.filename
    assert nodes.items[1].title == pdf_file.filename


async def test_upload_missing_file_parameter(
    auth_api_client: AuthTestClient,
    db_session: AsyncSession
):
    """Test that upload without file parameter fails"""
    resp = await auth_api_client.post(
        "/documents/upload",
        data={"title": "test.pdf"}
    )

    # Should fail with 422 validation error
    assert resp.status_code == 422, resp.json()


async def test_upload_returns_document_metadata(
    auth_api_client: AuthTestClient,
    db_session: AsyncSession,
    pdf_file: DocumentTestFileType
):
    """Test that upload response contains expected document metadata"""
    resp = await auth_api_client.post(
        "/documents/upload",
        files={"file": pdf_file.as_upload_tuple()}
    )

    assert resp.status_code == 201, resp.json()

    data = resp.json()

    # Check all expected fields are present in DocumentUploadResponse
    assert "id" in data
    assert "title" in data
    assert "processing_status" in data

    # Verify field values
    assert data["title"] == pdf_file.filename
    assert data["processing_status"] == "uploaded"


async def test_upload_uses_user_default_language(
    auth_api_client: AuthTestClient,
    db_session: AsyncSession,
    pdf_file: DocumentTestFileType
):
    """Test that upload uses user's default language when lang not specified

    Note: This test verifies the upload succeeds. The actual language
    verification would require checking the created document in the database.
    """
    resp = await auth_api_client.post(
        "/documents/upload",
        files={"file": pdf_file.as_upload_tuple()}
    )

    assert resp.status_code == 201, resp.json()

    data = resp.json()
    assert "id" in data
    assert data["title"] == pdf_file.filename


async def test_upload_empty_title_uses_filename(
    auth_api_client: AuthTestClient,
    db_session: AsyncSession,
    pdf_file: DocumentTestFileType
):
    """Test that empty title parameter falls back to filename"""
    resp = await auth_api_client.post(
        "/documents/upload",
        files={"file": pdf_file.as_upload_tuple()},
        data={"title": ""}
    )

    assert resp.status_code == 201, resp.json()

    data = resp.json()
    assert data["title"] == pdf_file.filename
