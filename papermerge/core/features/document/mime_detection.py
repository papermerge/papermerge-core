"""
Mime type detection and validation

This module provides server-side mime type detection based on file content
rather than trusting client-provided Content-Type headers. It supports
PDF, JPEG, PNG, and TIFF formats.

Uses pikepdf for PDF validation to leverage existing dependency.
"""
import io
import logging
from typing import Optional

import pikepdf
from PIL import Image

from papermerge.core.types import MimeType

logger = logging.getLogger(__name__)



class UnsupportedFileTypeError(Exception):
    """Raised when file type is not supported by Papermerge."""
    pass


class InvalidFileError(Exception):
    """Raised when file is corrupted or cannot be processed."""
    pass


# Magic bytes for file type detection
MAGIC_BYTES = {
    MimeType.application_pdf: [
        b'%PDF-',  # PDF signature at start
    ],
    MimeType.image_jpeg: [
        b'\xFF\xD8\xFF\xDB',  # JPEG/JFIF
        b'\xFF\xD8\xFF\xE0',  # JPEG/JFIF
        b'\xFF\xD8\xFF\xE1',  # JPEG/EXIF
        b'\xFF\xD8\xFF\xEE',  # JPEG
    ],
    MimeType.image_png: [
        b'\x89PNG\r\n\x1a\n',  # PNG signature
    ],
    MimeType.image_tiff: [
        b'II\x2A\x00',  # TIFF little-endian
        b'MM\x00\x2A',  # TIFF big-endian
    ],
}


# File extension to mime type mapping
EXTENSION_MAP = {
    'pdf': MimeType.application_pdf,
    'jpg': MimeType.image_jpeg,
    'jpeg': MimeType.image_jpeg,
    'png': MimeType.image_png,
    'tif': MimeType.image_tiff,
    'tiff': MimeType.image_tiff,
}


def detect_from_content(content: bytes) -> MimeType:
    """
    Detect mime type by examining file magic bytes.

    Args:
        content: File content as bytes (at least first 8 bytes recommended)

    Returns:
        Detected MimeType

    Raises:
        UnsupportedFileTypeError: If file type cannot be determined or is not supported
    """
    if len(content) < 8:
        raise UnsupportedFileTypeError("File too small to determine type")

    # Check magic bytes
    for mime_type, signatures in MAGIC_BYTES.items():
        for signature in signatures:
            if content.startswith(signature):
                return mime_type

    raise UnsupportedFileTypeError(
        f"Unsupported or unrecognized file type. "
        f"First bytes: {content[:16].hex()}"
    )


def detect_from_extension(filename: str) -> Optional[MimeType]:
    """
    Detect mime type from file extension.

    Args:
        filename: Name of the file

    Returns:
        MimeType if extension is recognized, None otherwise
    """
    if not filename:
        return None

    # Extract extension
    parts = filename.lower().rsplit('.', 1)
    if len(parts) != 2:
        return None

    extension = parts[1]
    return EXTENSION_MAP.get(extension)


def validate_file_structure(content: bytes, mime_type: MimeType) -> None:
    """
    Validate that file can actually be opened and is not corrupted.

    Args:
        content: Complete file content
        mime_type: Detected mime type

    Raises:
        InvalidFileError: If file is corrupted or cannot be processed
    """
    try:
        if mime_type == MimeType.application_pdf:
            # Validate PDF structure using pikepdf
            pdf = pikepdf.open(io.BytesIO(content))
            page_count = len(pdf.pages)

            if page_count == 0:
                raise InvalidFileError("PDF has no pages")

            # Try to access first page to ensure it's readable
            _ = pdf.pages[0]

            logger.debug(f"Validated PDF with {page_count} pages")

            # pikepdf objects are context managers, close explicitly
            pdf.close()

        elif mime_type in (MimeType.image_jpeg, MimeType.image_png, MimeType.image_tiff):
            # Validate image structure
            img = Image.open(io.BytesIO(content))
            img.verify()  # Checks for corruption

            # Re-open to get dimensions (verify() closes the image)
            img = Image.open(io.BytesIO(content))
            width, height = img.size

            if width == 0 or height == 0:
                raise InvalidFileError("Image has invalid dimensions")

            logger.debug(
                f"Validated {mime_type.value} image: {width}x{height}, "
                f"mode={img.mode}"
            )

    except InvalidFileError:
        raise
    except Exception as e:
        raise InvalidFileError(
            f"File validation failed for {mime_type.value}: {str(e)}"
        ) from e


def detect_and_validate_mime_type(
    content: bytes,
    filename: str,
    client_content_type: Optional[str] = None,
    validate_structure: bool = True,
) -> MimeType:
    """
    Detect and validate mime type from file content.

    This is the main entry point for mime type detection. It:
    1. Detects mime type from file content (magic bytes)
    2. Cross-checks with file extension
    3. Optionally validates file structure
    4. Logs discrepancies for security/debugging

    Args:
        content: Complete file content as bytes
        filename: Original filename
        client_content_type: Optional Content-Type header from client (for logging only)
        validate_structure: If True, validates file can be opened (default: True)

    Returns:
        Detected and validated MimeType

    Raises:
        UnsupportedFileTypeError: If file type is not supported
        InvalidFileError: If file is corrupted or cannot be processed

    Example:
        >>> content = Path("document.pdf").read_bytes()
        >>> mime_type = detect_and_validate_mime_type(content, "document.pdf")
        >>> print(mime_type)
        MimeType.PDF
    """
    # Primary detection from content
    try:
        detected_mime = detect_from_content(content)
    except UnsupportedFileTypeError as e:
        logger.warning(
            f"Failed to detect mime type for file '{filename}': {e}"
        )
        raise

    # Secondary check against filename extension
    expected_from_filename = detect_from_extension(filename)

    if expected_from_filename and detected_mime != expected_from_filename:
        logger.warning(
            f"Mime type mismatch for '{filename}': "
            f"content={detected_mime.value}, "
            f"extension suggests={expected_from_filename.value}"
        )
        # We trust content over extension, but log the discrepancy

    # Log if client sent incorrect Content-Type
    if client_content_type:
        # Normalize client content type (might have charset, etc.)
        client_mime = client_content_type.split(';')[0].strip().lower()

        if client_mime != detected_mime.value:
            logger.info(
                f"Client sent incorrect Content-Type for '{filename}': "
                f"client={client_mime}, actual={detected_mime.value}"
            )

    # Validate file structure
    if validate_structure:
        try:
            validate_file_structure(content, detected_mime)
        except InvalidFileError as e:
            logger.error(
                f"File structure validation failed for '{filename}': {e}"
            )
            raise

    logger.info(
        f"Successfully detected and validated '{filename}' "
        f"as {detected_mime.value}"
    )

    return detected_mime


def get_file_info(content: bytes, filename: str) -> dict:
    """
    Get comprehensive file information including mime type and metadata.

    This is a convenience function that returns additional information
    beyond just the mime type.

    Args:
        content: Complete file content
        filename: Original filename

    Returns:
        Dictionary with file information:
        - mime_type: Detected MimeType
        - size: File size in bytes
        - page_count: Number of pages (PDF) or 1 (images)
        - dimensions: Image dimensions as (width, height) or None
        - color_space: Image color mode or None

    Raises:
        UnsupportedFileTypeError: If file type is not supported
        InvalidFileError: If file is corrupted
    """
    mime_type = detect_and_validate_mime_type(content, filename)

    info = {
        'mime_type': mime_type,
        'size': len(content),
        'page_count': 0,
        'dimensions': None,
        'color_space': None,
    }

    try:
        if mime_type == MimeType.application_pdf:
            pdf = pikepdf.open(io.BytesIO(content))
            info['page_count'] = len(pdf.pages)
            pdf.close()

        elif mime_type in (MimeType.image_jpeg, MimeType.image_png, MimeType.image_tiff):
            img = Image.open(io.BytesIO(content))
            info['page_count'] = 1
            info['dimensions'] = img.size
            info['color_space'] = img.mode

    except Exception as e:
        logger.warning(f"Could not extract metadata from '{filename}': {e}")

    return info
