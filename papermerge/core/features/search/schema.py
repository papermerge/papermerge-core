from decimal import Decimal
from typing import List, Optional, Any, Union
from uuid import UUID
from enum import Enum
from datetime import date, datetime

from pydantic import (
    BaseModel,
    Field,
    field_validator,
    ConfigDict
)

from papermerge.core.constants import DEFAULT_TAG_BG_COLOR, DEFAULT_TAG_FG_COLOR
from papermerge.core.types import OwnerType
from papermerge.core.schemas.common import ByUser, OwnedBy


# ============================================================================
# ENUMS
# ============================================================================

class CustomFieldOperator(str, Enum):
    """Comparison operators for filters"""
    # Equality
    EQ = "eq"  # = (exact match)
    NE = "ne"  # != (not equal)

    # Comparison (for numeric/date fields)
    GT = "gt"  # >
    GTE = "gte"  # >=
    LT = "lt"  #
    LTE = "lte"  # <=

    # Text operations
    CONTAINS = "contains"  # : (partial match, case-insensitive)

    # List operations
    IN = "in"  # value in list
    NOT_IN = "not_in"  # value not in list


class TagOperator(str, Enum):
    ANY = "any"
    ALL = "all"
    NOT = "not"

class CategoryOperator(str, Enum):
    ANY = "any"
    NOT = "not"


class SortBy(str, Enum):
    """Sorting options"""
    ID = "id"
    TITLE = "title"
    CATEGORY = "category"
    CREATED_AT = "created_at"
    UPDATED_AT = "updated_at"
    CREATED_BY = "created_by"
    UPDATED_BY = "updated_by"
    OWNED_BY = "owned_by"


class SortDirection(str, Enum):
    """Sort direction"""
    ASC = "asc"
    DESC = "desc"


class SearchLanguage(str, Enum):
    DEU = "deu"
    ENG = "eng"
    SPA = "spa"
    FRA = "fra"


# ============================================================================
# FILTER SCHEMAS
# ============================================================================

class FullTextSearchFilter(BaseModel):
    """
    Full-text search filter with support for AND/OR logic and grouping.

    Examples:
        - ["notes", "from", "Eugen"] -> notes & from & Eugen (all required)
        - ["notes | meeting"] -> notes OR meeting
        - ["(notes from) | Eugen"] -> (notes AND from) OR Eugen
    """
    terms: List[str] = Field(
        ...,
        min_length=1,
        description="Search terms with optional OR (|) operators and grouping with parentheses",
        examples=[
            ["meeting notes"],
            ["urgent | important"],
            ["(meeting notes) | (weekly report)"]
        ]
    )

    @field_validator('terms')
    @classmethod
    def validate_terms(cls, v: List[str]) -> List[str]:
        """Validate that terms are not empty and strip whitespace"""
        if not v:
            raise ValueError('FTS terms cannot be empty')

        cleaned_terms = [term.strip() for term in v if term.strip()]

        if not cleaned_terms:
            raise ValueError('FTS terms cannot be empty after cleaning')

        return cleaned_terms

    model_config = ConfigDict(
        json_schema_extra={
            "examples": [
                {"terms": ["meeting notes"]},
                {"terms": ["urgent | important"]},
                {"terms": ["(notes from) | Eugen"]}
            ]
        }
    )


class CategoryFilter(BaseModel):
    """
    Filter by document category/type using FTS matching.

    Supports multiple category values (OR logic between them).
    """
    values: List[str] = Field(
        ...,
        min_length=1,
        description="Category names (OR logic between values)",
        examples=[
            ["Invoice"],
            ["Blue Whale", "Green Whale"],
            ["Annual Report, Quarterly Report"]
        ]
    )

    operator: Optional[CategoryOperator] = Field(
        CategoryOperator.ANY,
        description="Operator applied to the category values",
        examples=[["any", "not"]]
    )

    @field_validator('values')
    @classmethod
    def validate_values(cls, v: List[str]) -> List[str]:
        """Split comma-separated values and validate"""
        if not v:
            raise ValueError('Category values cannot be empty')

        # Split comma-separated values
        all_values = []
        for value in v:
            # Split by comma and strip whitespace
            parts = [part.strip() for part in value.split(',') if part.strip()]
            all_values.extend(parts)

        if not all_values:
            raise ValueError('Category values cannot be empty after cleaning')

        return all_values



class TagFilter(BaseModel):
    """
    Filter by tags with support for inclusion and exclusion.

    - tags: Must have ALL these tags (AND logic)
    - tags_any: Must have ANY of these tags (OR logic)
    - tags_not: Must NOT have these tags (exclusion)
    """
    tags: Optional[List[str]] = Field(
        None,
        description="Tags values",
        examples=[["urgent", "2024"]]
    )

    operator: Optional[TagOperator] = Field(
        TagOperator.ALL,
        description="Operator applied to the tag",
        examples=[["all", "any", "not"]]
    )

    @field_validator('tags')
    @classmethod
    def validate_tag_list(cls, v: Optional[List[str]]) -> Optional[List[str]]:
        """Validate and clean tag lists"""
        if v is None:
            return None

        # Remove empty strings and strip whitespace
        cleaned = [tag.strip() for tag in v if tag and tag.strip()]

        return cleaned if cleaned else None


class CustomFieldFilter(BaseModel):
    """
    Filter by custom field value with type-aware comparisons.

    Operator compatibility:
    - Text fields: contains (:), eq (=, :=), ne (!=)
    - Numeric fields: eq (=), ne (!=), gt (>), gte (>=), lt (<), lte (<=)
    - Date fields: eq (=), ne (!=), gt (>), gte (>=), lt (<), lte (<=)
    - Boolean fields: eq (=), ne (!=)
    """
    field_name: str = Field(
        ...,
        min_length=1,
        description="Custom field name (case-insensitive)",
        examples=["total", "status", "invoice date", "active"]
    )

    operator: CustomFieldOperator = Field(
        ...,
        description="Comparison operator (must be compatible with field type)",
        examples=["contains", "eq", "gt", "gte"]
    )

    value: Union[str, int, float, bool, date] = Field(
        ...,
        description="Value to compare (type depends on field type)",
        examples=[
            "completed",
            100,
            1250.50,
            True,
            "2024-01-01"
        ]
    )

    @field_validator('field_name')
    @classmethod
    def validate_field_name(cls, v: str) -> str:
        """Validate and clean field name"""
        cleaned = v.strip()
        if not cleaned:
            raise ValueError('field_name cannot be empty')
        return cleaned

    @field_validator('value')
    @classmethod
    def validate_value(cls, v: Any) -> Any:
        """Validate value is not None"""
        if v is None:
            raise ValueError('value cannot be None')
        return v

    model_config = ConfigDict(
        json_schema_extra={
            "examples": [
                {"field_name": "total", "operator": "gt", "value": 100},
                {"field_name": "status", "operator": "contains", "value": "comp"},
                {"field_name": "status", "operator": "eq", "value": "completed"},
                {"field_name": "invoice date", "operator": "gte", "value": "2024-01-01"},
                {"field_name": "active", "operator": "eq", "value": True}
            ]
        }
    )


class OwnerFilter(BaseModel):
    type: Optional[OwnerType] = Field(
        OwnerType.USER,
        description="Filter by document owner type"
    )
    name: Optional[str] = Field(
        None,
        description="Filter by document owner name"
    )


# ============================================================================
# MAIN REQUEST/RESPONSE SCHEMAS
# ============================================================================

class SearchFilters(BaseModel):
    """
    All filters to apply to the search.
    All filters are combined with AND logic.
    """
    fts: Optional[FullTextSearchFilter] = Field(
        None,
        description="Full-text search across title, category, tags, and text custom fields"
    )

    category: Optional[CategoryFilter] = Field(
        None,
        description="Filter by document category/type (FTS matching)"
    )

    tags: Optional[List[TagFilter]] = Field(
        None,
        description="Tag filters (AND logic between multiple TagFilter objects)"
    )

    custom_fields: Optional[List[CustomFieldFilter]] = Field(
        None,
        description="Custom field filters (AND logic between filters)"
    )

    owner: Optional[OwnerFilter] = Field(
        None,
        description="Owner of the document"
    )



class SearchQueryParams(BaseModel):
    """
    Advanced search request with structured filters.

    All filters are combined with AND logic:
    - FTS AND category AND tags AND custom_fields
    """
    filters: Optional[SearchFilters] = Field(
        [],
        description="Search filters to apply"
    )

    # Optional parameters
    lang: Optional[SearchLanguage] = Field(
        None,
        description="Language for FTS (ISO 639-3 code). If not provided, uses user's preference.",
        examples=["eng", "deu", "fra", "spa"]
    )
    # Pagination
    page_size: int = Field(
        default=20,
        ge=1,
        le=100,
        description="Number of results per page"
    )

    page_number: int = Field(
        default=1,
        ge=1,
        description="Page number (1-indexed)"
    )

    # Sorting
    sort_by: str = Field(
        default=SortBy.UPDATED_AT,
        description="Sort results by field"
    )

    sort_direction: SortDirection = Field(
        default=SortDirection.DESC,
        description="Sort direction"
    )


# ============================================================================
# Custom Field Related Schemas (for document type search)
# ============================================================================

class CustomFieldValueData(BaseModel):
    """Custom field value data structure"""
    raw: Any | None = None
    sortable: Any | None = None
    metadata: dict[str, Any] = Field(default_factory=dict)

    model_config = ConfigDict(from_attributes=True)


class CustomFieldShort(BaseModel):
    """Custom field definition (short version)"""
    id: UUID
    name: str
    type_handler: str
    config: dict[str, Any] = Field(default_factory=dict)

    model_config = ConfigDict(from_attributes=True)


class CustomFieldValueShort(BaseModel):
    """Custom field value for a document"""
    value: CustomFieldValueData | None = None
    value_text: str | None = None
    value_numeric: Decimal | None = None
    value_date: date | None = None
    value_datetime: datetime | None = None
    value_boolean: bool | None = None

    model_config = ConfigDict(from_attributes=True)


class CustomFieldRow(BaseModel):
    """Single custom field with its value"""
    custom_field: CustomFieldShort
    custom_field_value: CustomFieldValueShort | None = None

    model_config = ConfigDict(from_attributes=True)


class CustomFieldInfo(BaseModel):
    """Custom field metadata (for document type)"""
    id: UUID
    name: str
    type_handler: str
    config: dict[str, Any]

    model_config = ConfigDict(from_attributes=True)


# ============================================================================
# Document Search Results
# ============================================================================


class Category(BaseModel):
    id: UUID
    name: str

class Tag(BaseModel):
    id: UUID
    name: str
    bg_color: str | None = DEFAULT_TAG_BG_COLOR
    fg_color: str | None = DEFAULT_TAG_FG_COLOR

class FlatDocument(BaseModel):
    """
    Flat document result (without custom fields).
    Used in general search across all document types.
    """
    id: UUID = Field(..., description="Document UUID")
    title: str = Field(..., description="Document title")
    category: Category | None = Field(None, description="Document category")
    tags: List[Tag] = Field(default_factory=list, description="Document tags")
    lang: str = Field(..., description="Document language")

    owned_by: OwnedBy = Field(..., description="Owner information")
    created_at: datetime = Field(..., description="Creation timestamp")
    updated_at: datetime = Field(..., description="Last update timestamp")
    created_by: ByUser | None = Field(None, description="Created by user")
    updated_by: ByUser | None = Field(None, description="Last updated by user")

    model_config = ConfigDict(from_attributes=True)


class DocumentCFV(BaseModel):
    """
    Document with custom field values.
    Used in document type-specific search.
    """
    document_id: UUID
    title: str
    document_type_id: UUID | None = None
    document_type_name: str | None = None
    tags: List[str] = Field(default_factory=list)
    custom_fields: List[CustomFieldRow] = Field(default_factory=list)
    lang: str
    last_updated: datetime

    model_config = ConfigDict(from_attributes=True)


# ============================================================================
# Search Responses
# ============================================================================

class SearchDocumentsResponse(BaseModel):
    """
    Response for general search (across all document types).
    Similar to /documents/ endpoint.
    Does NOT include custom field values since documents may have different types.
    """
    items: List[FlatDocument] = Field(..., description="Search results")
    page_number: int = Field(..., ge=1, description="Current page number")
    page_size: int = Field(..., ge=1, description="Items per page")
    num_pages: int = Field(..., ge=0, description="Total number of pages")
    total_items: int = Field(..., ge=0, description="Total number of results")
    document_type_id: Optional[UUID] = None

    model_config = ConfigDict(from_attributes=True)



class SearchDocumentsByTypeResponse(BaseModel):
    """
    Response for document type-specific search.
    Similar to /documents/type/{document_type_id}/ endpoint.
    Includes custom field values and metadata.
    """
    items: List[DocumentCFV] = Field(..., description="Search results with custom fields")
    page_number: int = Field(..., ge=1, description="Current page number")
    page_size: int = Field(..., ge=1, description="Items per page")
    num_pages: int = Field(..., ge=0, description="Total number of pages")
    total_items: int = Field(..., ge=0, description="Total number of results")
    document_type_id: UUID
    custom_fields: List[CustomFieldInfo] = Field(
        ...,
        description="Custom fields metadata for this document type"
    )

    model_config = ConfigDict(from_attributes=True)
