import logging

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status

from papermerge.core import scopes
from papermerge.core.features.search.db import api as search_dbapi
from papermerge.core.db.engine import get_db
from .schema import SearchQueryParams, SearchDocumentsResponse

router = APIRouter(
    prefix="/search",
    tags=["search"]
)


logger = logging.getLogger(__name__)



@router.post(
    "/",
    response_model=SearchDocumentsResponse,
    responses={
        400: {
            "description": "Invalid search parameters (e.g., invalid date range, non-existent document type)"
        },
        403: {
            "description": "Insufficient permissions - missing required scope: node:view"
        },
        500: {
            "description": "Internal server error - search operation failed"
        }
    }
)
async def documents_search(
    user: scopes.ViewNode,
    params: SearchQueryParams,
    db_session: AsyncSession = Depends(get_db)
):
    """
    Advanced document search and filtering.

    **Search capabilities:**
    - Full-text search across document titles and content
    - Filter by document type (category), tags, or custom metadata
    - Filter by custom field values (works with any custom field)
    - Sort by relevance, date, title, or custom field values
    - Paginated results

    **Custom Fields in Response:**
    The response includes custom field metadata and values based on:
    1. Document types specified in category filters → all their custom fields
    2. Custom fields referenced in custom_field filters → those specific fields

    The custom_fields in response is the union of all relevant fields (deduplicated).

    **Parameters:**
    - `filters.fts`: Full-text search terms
    - `filters.categories`: Filter by category/document type
    - `filters.tags`: Filter by tags
    - `filters.custom_fields`: Filter by custom field values
    - `page_number`: Page number for pagination (default: 1)
    - `page_size`: Results per page (default: 20, max: 100)
    - `sort_by`: Field to sort by (can be custom field name)
    - `sort_direction`: asc or desc (default: desc)

    **Response:**
    - `items`: List of documents with their custom field values
    - `custom_fields`: Metadata about custom fields included in response
    - `document_type_id`: Set when filtering by exactly one document type
    """
    try:
        logger.info(
            f"User {user.id} searching documents",
            extra={
                "filters": params.filters.model_dump() if params.filters else None,
                "page": params.page_number
            }
        )
        # Use unified search function
        result = await search_dbapi.search_documents(
            db_session=db_session,
            user_id=user.id,
            params=params
        )

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
