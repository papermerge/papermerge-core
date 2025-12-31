from datetime import datetime, timedelta, timezone
from uuid import UUID

from fastapi import APIRouter, HTTPException, status, Depends

from papermerge.core import db, scopes
from papermerge.core.features.api_tokens import schema
from papermerge.core.features.api_tokens.db import api as dbapi
from papermerge.core.types import PaginatedResponse

router = APIRouter(prefix="/tokens", tags=["tokens"])


@router.post(
    "",
    response_model=schema.APITokenCreated,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new API token",
    description="""
Create a new Personal Access Token (PAT) for API authentication.

**IMPORTANT**: The token value is only returned in this response and cannot
be retrieved later. Save it securely!

The token can be used in the Authorization header:
```
Authorization: Bearer pm_xxxxx...
```

Optionally, you can:
- Limit the token's permissions with `scopes`
- Set an expiration with `expires_in_days`
""",
)
async def create_token(
    data: schema.APITokenCreate,
    user: scopes.CreateAPIToken,
    db_session: db.DBRouterAsyncSession,
) -> schema.APITokenCreated:
    """Create a new API token for the current user."""

    # Calculate expiration if specified
    expires_at = None
    if data.expires_in_days:
        expires_at = datetime.now(timezone.utc) + timedelta(days=data.expires_in_days)

    # Create the token
    api_token, full_token = await dbapi.create_api_token(
        db_session=db_session,
        user_id=user.id,
        name=data.name,
        scopes=data.scopes,
        expires_at=expires_at,
    )

    return schema.APITokenCreated(
        id=api_token.id,
        name=api_token.name,
        token=full_token,  # Only time we return the actual token!
        token_prefix=api_token.token_prefix,
        scopes=api_token.scope_list if api_token.scopes else None,
        created_at=api_token.created_at,
        expires_at=api_token.expires_at,
    )


@router.get(
    "",
    response_model=PaginatedResponse[schema.APITokenResponse],
    summary="List your API tokens (paginated)",
    description="""
List all API tokens for the current user with pagination support.

Note: Token values are not included - only metadata like name, prefix,
creation date, and last usage.

**Pagination:** Use `page_number` and `page_size` query parameters.
**Sorting:** Use `sort_by` and `sort_direction` query parameters.
**Filtering:** Use `filter_free_text` to search by token name.
""",
)
async def list_tokens(
    user: scopes.ViewAPIToken,
    db_session: db.DBRouterAsyncSession,
    params: schema.TokenQueryParams = Depends(),
) -> PaginatedResponse[schema.APITokenResponse]:
    """List all API tokens for the current user (paginated)."""
    result = await dbapi.get_user_tokens_paginated(
        db_session,
        user_id=user.id,
        page_number=params.page_number,
        page_size=params.page_size,
        sort_by=params.sort_by,
        sort_direction=params.sort_direction,
        filter_free_text=params.filter_free_text,
    )

    # Convert ORM objects to response schema
    items = [schema.APITokenResponse.from_orm_with_scopes(t) for t in result.items]

    return PaginatedResponse(
        items=items,
        page_number=result.page_number,
        page_size=result.page_size,
        num_pages=result.num_pages,
    )

@router.get(
    "/{token_id}",
    response_model=schema.APITokenResponse,
    summary="Get token details",
    description="Get details of a specific API token.",
)
async def get_token(
    token_id: UUID,
    user: scopes.ViewAPIToken,
    db_session: db.DBRouterAsyncSession,
) -> schema.APITokenResponse:
    """Get details of a specific token."""
    api_token = await dbapi.get_token_by_id(db_session, token_id, user.id)

    if api_token is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Token not found",
        )

    return schema.APITokenResponse.from_orm_with_scopes(api_token)


@router.delete(
    "/{token_id}",
    response_model=schema.APITokenDeleted,
    summary="Revoke an API token",
    description="""
Revoke (delete) an API token. The token will immediately stop working.

This action cannot be undone.
""",
)
async def delete_token(
    token_id: UUID,
    user: scopes.DeleteAPIToken,
    db_session: db.DBRouterAsyncSession,
) -> schema.APITokenDeleted:
    """Revoke an API token."""
    # Get token first to return its name in response
    api_token = await dbapi.get_token_by_id(db_session, token_id, user.id)

    if api_token is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Token not found",
        )

    token_name = api_token.name
    deleted = await dbapi.delete_token(db_session, token_id, user.id)

    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Token not found",
        )

    return schema.APITokenDeleted(id=token_id, name=token_name)
