from datetime import datetime
from typing import Literal, Optional
from uuid import UUID

from fastapi import Query
from pydantic import BaseModel, ConfigDict, Field


class APITokenCreate(BaseModel):
    """Schema for creating a new API token."""

    name: str = Field(
        ...,
        min_length=1,
        max_length=255,
        description="Human-readable name for the token (e.g., 'CLI on laptop')",
        examples=["CLI tool", "CI/CD pipeline", "Backup script"],
    )
    scopes: list[str] | None = Field(
        default=None,
        description="Optional list of scopes to limit token permissions. "
        "If not provided, token inherits all user permissions.",
        examples=[["node.view", "node.create"], None],
    )
    expires_in_days: int | None = Field(
        default=None,
        ge=1,
        le=365,
        description="Optional expiration in days from now. "
        "If not provided, token never expires.",
        examples=[30, 90, 365],
    )


class APITokenResponse(BaseModel):
    """
    Schema for API token in list/detail responses.

    Note: The actual token value is never included - it's only shown once
    at creation time.
    """

    id: UUID
    name: str
    token_prefix: str = Field(
        description="First 8 characters of the token for identification"
    )
    scopes: list[str] | None = Field(
        description="Token scopes, or null if inheriting user permissions"
    )
    created_at: datetime
    expires_at: datetime | None
    last_used_at: datetime | None

    model_config = ConfigDict(from_attributes=True)

    @classmethod
    def from_orm_with_scopes(cls, orm_obj) -> "APITokenResponse":
        """Create response from ORM object, converting scopes string to list."""
        return cls(
            id=orm_obj.id,
            name=orm_obj.name,
            token_prefix=orm_obj.token_prefix,
            scopes=orm_obj.scope_list if orm_obj.scopes else None,
            created_at=orm_obj.created_at,
            expires_at=orm_obj.expires_at,
            last_used_at=orm_obj.last_used_at,
        )


class APITokenCreated(BaseModel):
    """
    Schema returned when a token is created.

    IMPORTANT: The `token` field contains the actual token value.
    This is the ONLY time the token is ever returned - it cannot
    be retrieved later. The user must save it securely.
    """

    id: UUID
    name: str
    token: str = Field(
        description="The actual token value. SAVE THIS - it will not be shown again!"
    )
    token_prefix: str
    scopes: list[str] | None
    created_at: datetime
    expires_at: datetime | None

    model_config = ConfigDict(from_attributes=True)


class APITokenDeleted(BaseModel):
    """Schema for token deletion confirmation."""

    id: UUID
    name: str
    message: str = "Token successfully revoked"


class TokenQueryParams(BaseModel):
    """Query parameters for paginated token listing."""

    # Pagination parameters
    page_size: int = Query(
        15,
        ge=1,
        le=100,
        description="Number of items per page"
    )
    page_number: int = Query(
        1,
        ge=1,
        description="Page number (1-based)"
    )

    # Sorting parameters
    sort_by: Optional[str] = Query(
        None,
        pattern="^(id|name|created_at|expires_at|last_used_at)$",
        description="Column to sort by: id, name, created_at, expires_at, last_used_at"
    )
    sort_direction: Optional[Literal["asc", "desc"]] = Query(
        None,
        description="Sort direction: asc or desc"
    )

    # Filter parameters
    filter_free_text: Optional[str] = Query(
        None,
        description="Filter by name (partial match)"
    )
