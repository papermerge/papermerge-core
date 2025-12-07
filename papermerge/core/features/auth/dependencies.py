"""
Dependency helpers for scope-based authentication.
Provides a single source of truth for scope requirements.
"""

from typing import Annotated

from fastapi import Security

from papermerge.core.features.auth import get_current_user
from papermerge.core.features.auth.scopes import Scopes
from papermerge.core import schema


def require_scopes(*required_scopes: str):
    """
    Factory function for creating a user dependency with required scopes.

    This provides a single source of truth - scopes are defined once and used for:
    1. Access control enforcement (via Security)
    2. OpenAPI documentation (via custom openapi generator)

    Usage:
        @router.get("/documents/")
        async def get_documents(
            user: require_scopes(scopes.NODE_VIEW),
            db_session: AsyncSession = Depends(get_db),
        ):
            '''Get documents'''
            ...

    Args:
        *required_scopes: One or more scope strings (e.g., scopes.NODE_VIEW)

    Returns:
        Annotated type for FastAPI dependency injection
    """
    return Annotated[
        schema.User,
        Security(get_current_user, scopes=list(required_scopes))
    ]


# Pre-defined common dependencies for convenience
UserWithNodeView = require_scopes(Scopes.NODE_VIEW)
UserWithNodeCreate = require_scopes(Scopes.NODE_CREATE)
UserWithNodeUpdate = require_scopes(Scopes.NODE_UPDATE)
UserWithNodeDelete = require_scopes(Scopes.NODE_DELETE)
UserWithDocumentUpload = require_scopes(Scopes.DOCUMENT_UPLOAD)
