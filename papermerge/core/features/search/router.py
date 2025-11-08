from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from papermerge.core.features.auth.dependencies import require_scopes
from papermerge.core.features.auth import scopes
from papermerge.core.features.search.db import api as search_dbapi
from papermerge.core.db.engine import get_db
from .schema import SearchQueryParams, SearchDocumentsByTypeResponse, \
    SearchDocumentsResponse

router = APIRouter(
    prefix="/search",
    tags=["search"]
)

from fastapi import HTTPException, status
import logging

logger = logging.getLogger(__name__)


async def documents_search(
    user: require_scopes(scopes.NODE_VIEW),
    params: SearchQueryParams,
    db_session: AsyncSession = Depends(get_db)
) -> SearchDocumentsByTypeResponse | SearchDocumentsResponse:
    """
    Advanced document search and filtering.

    **Search capabilities:**
    - Full-text search across document titles and content
    - Filter by document type, tags, dates, or custom metadata
    - Sort by relevance, date, title, or size
    - Paginated results

    **Parameters:**
    - `query`: Search text (optional)
    - `filters.category`: Filter by category/document type (optional)
    - `page`: Page number for pagination (default: 1)
    - `page_size`: Results per page (default: 20, max: 100)
    - `sort_by`: Field to sort by (default: relevance)
    - `sort_order`: asc or desc (default: desc)
    """
    try:
        logger.info(
            f"User {user.id} searching documents",
            extra={
                "filters": params.filters.model_dump() if params.filters else None,
                "page": params.page_number
            }
        )

        # Extract document type from category filter
        document_type_id = await search_dbapi.extract_document_type_from_category(
            db_session=db_session,
            params=params
        )

        if document_type_id is not None:
            # Single category filter - search within specific document type
            result = await search_dbapi.search_documents_by_type(
                db_session=db_session,
                document_type_id=document_type_id,
                user_id=user.id,
                params=params
            )
            # Add discriminator to response
            result.document_type_id = document_type_id
        else:
            # No category or multiple categories - flat search
            result = await search_dbapi.search_documents(
                db_session=db_session,
                user_id=user.id,
                params=params
            )
            # Discriminator is already None in the response

        logger.debug(f"Search returned {len(result.items)} results for user {user.id}")
        return result

    except ValueError as e:
        logger.warning(f"Invalid search parameters for user {user.id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except PermissionError as e:
        logger.warning(f"Permission denied for user {user.id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to access these documents"
        )
    except Exception as e:
        logger.error(
            f"Search failed for user {user.id}: {e}",
            exc_info=True
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Search operation failed. Please try again later."
        )
