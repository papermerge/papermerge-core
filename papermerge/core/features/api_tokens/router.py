from datetime import datetime, timedelta, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from papermerge.core.db.engine import get_db
from papermerge.core.features.api_tokens import schema
from papermerge.core.features.api_tokens.db import api as dbapi
from papermerge.core.features.auth import get_current_user
from papermerge.core.features.users.schema import User

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
    user: User = Depends(get_current_user),
    db_session: AsyncSession = Depends(get_db),
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
    response_model=list[schema.APITokenResponse],
    summary="List your API tokens",
    description="""
List all API tokens for the current user.

Note: Token values are not included - only metadata like name, prefix,
creation date, and last usage.
""",
)
async def list_tokens(
    user: User = Depends(get_current_user),
    db_session: AsyncSession = Depends(get_db),
) -> list[schema.APITokenResponse]:
    """List all API tokens for the current user."""
    tokens = await dbapi.get_user_tokens(db_session, user.id)
    return [schema.APITokenResponse.from_orm_with_scopes(t) for t in tokens]


@router.get(
    "/{token_id}",
    response_model=schema.APITokenResponse,
    summary="Get token details",
    description="Get details of a specific API token.",
)
async def get_token(
    token_id: UUID,
    user: User = Depends(get_current_user),
    db_session: AsyncSession = Depends(get_db),
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
    user: User = Depends(get_current_user),
    db_session: AsyncSession = Depends(get_db),
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
