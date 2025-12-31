"""
Database API for API tokens (PAT) management.

Provides CRUD operations for Personal Access Tokens.
"""
import hashlib
import secrets
from datetime import datetime, timezone
from typing import Literal
from uuid import UUID

from sqlalchemy import delete, func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from papermerge.core.features.api_tokens.db.orm import APIToken
from papermerge.core.types import PaginatedResponse

# Token prefix for easy identification
TOKEN_PREFIX = "pm_"


def generate_token() -> tuple[str, str, str]:
    """
    Generate a new API token.

    Returns:
        tuple: (full_token, token_hash, token_prefix)
            - full_token: The actual token to give to the user (shown once)
            - token_hash: SHA256 hash to store in database
            - token_prefix: First 8 chars after prefix for display
    """
    # Generate 32 bytes of random data, encode as base64url
    random_bytes = secrets.token_urlsafe(32)
    full_token = f"{TOKEN_PREFIX}{random_bytes}"

    # Hash for storage
    token_hash = hashlib.sha256(full_token.encode()).hexdigest()

    # Prefix for display (first 8 chars after pm_)
    token_prefix = random_bytes[:8]

    return full_token, token_hash, token_prefix


def hash_token(token: str) -> str:
    """Hash a token for lookup."""
    return hashlib.sha256(token.encode()).hexdigest()


def is_pat_token(token: str) -> bool:
    """Check if a token is a PAT (starts with pm_)."""
    return token.startswith(TOKEN_PREFIX)


async def create_api_token(
    db_session: AsyncSession,
    user_id: UUID,
    name: str,
    scopes: list[str] | None = None,
    expires_at: datetime | None = None,
) -> tuple[APIToken, str]:
    """
    Create a new API token for a user.

    Args:
        db_session: Database session
        user_id: Owner's user ID
        name: Human-readable name for the token
        scopes: Optional list of scopes to limit token permissions
        expires_at: Optional expiration datetime

    Returns:
        tuple: (APIToken orm object, full_token string)
            The full_token is only returned once - store it securely!
    """
    full_token, token_hash, token_prefix = generate_token()

    # Convert scopes list to comma-separated string
    scopes_str = ",".join(scopes) if scopes else None

    api_token = APIToken(
        user_id=user_id,
        name=name,
        token_hash=token_hash,
        token_prefix=token_prefix,
        scopes=scopes_str,
        expires_at=expires_at,
    )

    db_session.add(api_token)
    await db_session.commit()
    await db_session.refresh(api_token)

    return api_token, full_token


async def get_token_by_hash(
    db_session: AsyncSession,
    token_hash: str,
) -> APIToken | None:
    """
    Look up an API token by its hash.

    This is the primary authentication path - called on every API request
    that uses a PAT.

    Args:
        db_session: Database session
        token_hash: SHA256 hash of the token

    Returns:
        APIToken if found, None otherwise
    """
    stmt = select(APIToken).where(APIToken.token_hash == token_hash)
    result = await db_session.execute(stmt)
    return result.scalar_one_or_none()


async def get_user_tokens(
    db_session: AsyncSession,
    user_id: UUID,
) -> list[APIToken]:
    """
    Get all API tokens for a user (non-paginated).

    Args:
        db_session: Database session
        user_id: User's ID

    Returns:
        List of APIToken objects (without actual token values)
    """
    stmt = (
        select(APIToken)
        .where(APIToken.user_id == user_id)
        .order_by(APIToken.created_at.desc())
    )
    result = await db_session.execute(stmt)
    return list(result.scalars().all())


async def get_user_tokens_paginated(
    db_session: AsyncSession,
    user_id: UUID,
    page_number: int = 1,
    page_size: int = 15,
    sort_by: str | None = None,
    sort_direction: Literal["asc", "desc"] | None = None,
    filter_free_text: str | None = None,
) -> PaginatedResponse[APIToken]:
    """
    Get paginated API tokens for a user.

    Args:
        db_session: Database session
        user_id: User's ID
        page_number: Page number (1-based)
        page_size: Number of items per page
        sort_by: Column to sort by
        sort_direction: Sort direction (asc or desc)
        filter_free_text: Filter by name (partial match)

    Returns:
        PaginatedResponse containing APIToken objects
    """
    # Base query
    base_query = select(APIToken).where(APIToken.user_id == user_id)

    # Apply text filter
    if filter_free_text:
        base_query = base_query.where(
            APIToken.name.ilike(f"%{filter_free_text}%")
        )

    # Count total items
    count_stmt = select(func.count()).select_from(base_query.subquery())
    total_result = await db_session.execute(count_stmt)
    total_items = total_result.scalar() or 0

    # Apply sorting
    if sort_by:
        sort_column = getattr(APIToken, sort_by, APIToken.created_at)
        if sort_direction == "asc":
            base_query = base_query.order_by(sort_column.asc())
        else:
            base_query = base_query.order_by(sort_column.desc())
    else:
        # Default sort by created_at desc
        base_query = base_query.order_by(APIToken.created_at.desc())

    # Apply pagination
    offset = (page_number - 1) * page_size
    base_query = base_query.offset(offset).limit(page_size)

    # Execute query
    result = await db_session.execute(base_query)
    items = list(result.scalars().all())

    # Calculate number of pages
    num_pages = (total_items + page_size - 1) // page_size if total_items > 0 else 0

    return PaginatedResponse(
        items=items,
        page_number=page_number,
        page_size=page_size,
        num_pages=num_pages,
    )


async def get_token_by_id(
    db_session: AsyncSession,
    token_id: UUID,
    user_id: UUID,
) -> APIToken | None:
    """
    Get a specific API token by ID.

    Args:
        db_session: Database session
        token_id: Token's ID
        user_id: User's ID (for ownership verification)

    Returns:
        APIToken if found and owned by user, None otherwise
    """
    stmt = select(APIToken).where(
        APIToken.id == token_id,
        APIToken.user_id == user_id,
    )
    result = await db_session.execute(stmt)
    return result.scalar_one_or_none()


async def delete_token(
    db_session: AsyncSession,
    token_id: UUID,
    user_id: UUID,
) -> bool:
    """
    Delete (revoke) an API token.

    Args:
        db_session: Database session
        token_id: Token's ID
        user_id: User's ID (for ownership verification)

    Returns:
        True if token was deleted, False if not found
    """
    stmt = delete(APIToken).where(
        APIToken.id == token_id,
        APIToken.user_id == user_id,
    )
    result = await db_session.execute(stmt)
    await db_session.commit()
    return result.rowcount > 0


async def update_last_used(
    db_session: AsyncSession,
    token_id: UUID,
) -> None:
    """
    Update the last_used_at timestamp for a token.

    Called after successful authentication with a PAT.

    Args:
        db_session: Database session
        token_id: Token's ID
    """
    stmt = (
        update(APIToken)
        .where(APIToken.id == token_id)
        .values(last_used_at=datetime.now(timezone.utc))
    )
    await db_session.execute(stmt)
    # Don't commit here - let the request handler commit
    # This avoids extra round-trips on every authenticated request


async def validate_token(
    db_session: AsyncSession,
    token: str,
) -> APIToken | None:
    """
    Validate a PAT token and return the associated APIToken if valid.

    This is the main entry point for PAT authentication. It:
    1. Checks if the token has the correct prefix
    2. Hashes the token and looks it up
    3. Checks if the token has expired
    4. Updates last_used_at timestamp

    Args:
        db_session: Database session
        token: The full token string (pm_xxx...)

    Returns:
        APIToken if valid, None otherwise
    """
    if not is_pat_token(token):
        return None

    token_hash = hash_token(token)
    api_token = await get_token_by_hash(db_session, token_hash)

    if api_token is None:
        return None

    if api_token.is_expired:
        return None

    # Update last used timestamp (fire and forget - don't wait for commit)
    await update_last_used(db_session, api_token.id)

    return api_token
