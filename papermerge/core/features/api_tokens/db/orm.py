"""
API Tokens ORM model for Personal Access Tokens (PAT).

PATs allow users to authenticate with the REST API using a long-lived token
instead of going through OIDC flows. This is essential for:
- CLI tools (papermerge-cli)
- Scripts and automation
- Third-party integrations
- CI/CD pipelines
"""
import uuid
from datetime import datetime, timezone

from sqlalchemy import ForeignKey, Index, String, func
from sqlalchemy.dialects.postgresql import TIMESTAMP, UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from papermerge.core.db.base import Base


def utc_now():
    """Returns current time in UTC"""
    return datetime.now(timezone.utc)


class APIToken(Base):
    """
    Personal Access Token (PAT) for API authentication.

    Tokens are stored as SHA256 hashes - the actual token value is only
    shown once at creation time and cannot be retrieved later.

    Token format: pm_<base64url-random-32-bytes>
    Example: pm_xK9mN2pQrStUvWxYz0123456789abcdefghij

    The "pm_" prefix allows easy identification of token type without
    parsing (distinguishes from OIDC JWTs which contain dots).
    """

    __tablename__ = "api_tokens"

    id: Mapped[uuid.UUID] = mapped_column(
        PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )

    # Token owner
    user_id: Mapped[uuid.UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # Human-readable name for the token (e.g., "CLI on laptop", "CI/CD pipeline")
    name: Mapped[str] = mapped_column(String(255), nullable=False)

    # SHA256 hash of the token - never store the actual token!
    token_hash: Mapped[str] = mapped_column(String(64), nullable=False, unique=True)

    # Optional token prefix for identification without exposing full hash
    # Stores first 8 chars of the token (after pm_ prefix) for display
    token_prefix: Mapped[str] = mapped_column(String(12), nullable=False)

    # Optional scopes to limit token permissions (comma-separated)
    # If empty/null, token inherits all user scopes
    scopes: Mapped[str | None] = mapped_column(String(2000), nullable=True)

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True), default=utc_now, nullable=False
    )

    # Optional expiration - null means never expires
    expires_at: Mapped[datetime | None] = mapped_column(
        TIMESTAMP(timezone=True), nullable=True
    )

    # Track last usage for security auditing
    last_used_at: Mapped[datetime | None] = mapped_column(
        TIMESTAMP(timezone=True), nullable=True
    )

    # Relationship to user
    user: Mapped["User"] = relationship(  # noqa: F821
        "User", back_populates="api_tokens", lazy="joined"
    )

    __table_args__ = (
        # Fast lookup by token hash (primary auth path)
        Index("idx_api_tokens_token_hash", "token_hash"),
        # List tokens by user
        Index("idx_api_tokens_user_id", "user_id"),
    )

    def __repr__(self):
        return f"<APIToken(id={self.id}, name={self.name}, user_id={self.user_id})>"

    @property
    def is_expired(self) -> bool:
        """Check if token has expired."""
        if self.expires_at is None:
            return False
        return datetime.now(timezone.utc) > self.expires_at

    @property
    def scope_list(self) -> list[str]:
        """Get scopes as a list."""
        if not self.scopes:
            return []
        return [s.strip() for s in self.scopes.split(",") if s.strip()]
