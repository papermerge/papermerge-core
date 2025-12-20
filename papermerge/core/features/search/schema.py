from decimal import Decimal
from typing import List, Optional, Any, Union
from uuid import UUID
from enum import Enum
from datetime import date, datetime, timezone

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


class NumericOperator(str, Enum):
    EQ = "eq" # =
    NE = "ne" # !=
    GT = "gt" # >
    GTE = "gte" # >=
    LT = "lt"  # <
    LTE = "lte"  # <=


class OwnerOperator(str, Enum):
    EQ = "eq"
    NE = "ne"


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
    ILIKE = "ilike"
    NOT_ILIKE = "not_ilike"

    # List operations
    IN = "in"  # value in list
    NOT_IN = "not_in"  # value not in list

    # Multiselect
    ANY = "any"
    ALL = "all"
    NOT = "not"

    # Select
    IS_NULL = "is_null"
    IS_NOT_NULL = "is_not_null"

    # Boolean
    IS_CHECKED = "is_checked"
    IS_NOT_CHECKED = "is_not_checked"


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
        description="Category names",
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
    def validate_cat_values(cls, v: Optional[List[str]]) -> Optional[List[str]]:
        """Validate and clean category values"""
        if v is None:
            return None

        # Remove empty strings and strip whitespace
        cleaned = [cat.strip() for cat in v if cat and cat.strip()]

        return cleaned if cleaned else None



class TagFilter(BaseModel):
    """
    Filter by tags with support for inclusion and exclusion.

    - tags: Must have ALL these tags (AND logic)
    - tags_any: Must have ANY of these tags (OR logic)
    - tags_not: Must NOT have these tags (exclusion)
    """
    values: List[str] = Field(
        ...,
        description="Tags values",
        examples=[["urgent", "2024"]]
    )

    operator: Optional[TagOperator] = Field(
        TagOperator.ALL,
        description="Operator applied to the tag",
        examples=[["all", "any", "not"]]
    )

    @field_validator('values')
    @classmethod
    def validate_tag_values(cls, v: Optional[List[str]]) -> Optional[List[str]]:
        """Validate and clean tag values"""
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
        examples=["eq", "gt", "gte", "all", "any"]
    )

    values: Optional[List[str]] = Field(
        default=None,
        description="List of values",
        examples=[["urgent", "2024"]]
    )

    value: Optional[Union[str, int, float, bool, date]] = Field(
        default=None,
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


class OwnerValue(BaseModel):
    type: Optional[OwnerType] = Field(
        OwnerType.USER,
        description="Filter by document owner type"
    )
    id: Optional[UUID] = Field(
        None,
        description="Filter by document owner ID"
    )


class OwnerFilter(BaseModel):
    operator: OwnerOperator
    value: OwnerValue


class CreatedAtFilter(BaseModel):
    operator: NumericOperator
    value: datetime

    @field_validator('value', mode='after')
    @classmethod
    def ensure_timezone_aware(cls, v: datetime) -> datetime:
        """Treat naive datetimes as UTC"""
        if v.tzinfo is None:
            return v.replace(tzinfo=timezone.utc)
        return v


class CreatedByFilter(BaseModel):
    value: UUID # user id


class UpdatedByFilter(BaseModel):
    value: UUID  # user id


class UpdatedAtFilter(BaseModel):
    operator: NumericOperator
    value: datetime

    @field_validator('value', mode='after')
    @classmethod
    def ensure_timezone_aware(cls, v: datetime) -> datetime:
        """Treat naive datetimes as UTC"""
        if v.tzinfo is None:
            return v.replace(tzinfo=timezone.utc)
        return v

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

    categories: Optional[List[CategoryFilter]] = Field(
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

    owner: Optional[List[OwnerFilter]] = Field(
        None,
        description="Owner of the document"
    )

    created_at: Optional[List[CreatedAtFilter]]= Field(
        None,
        description="When first version of the document was created"
    )

    updated_at: Optional[List[UpdatedAtFilter]]= Field(
        None,
        description="When last version of the document was updated"
    )

    created_by: Optional[List[CreatedByFilter]]= Field(
        None,
        description="Who created the document"
    )

    updated_by: Optional[List[UpdatedByFilter]]= Field(
        None,
        description="Who updated the document"
    )

    @field_validator('tags')
    @classmethod
    def validate_tag_values(cls, tags: Optional[TagFilter]) -> Any:
        """Validate tags

        tag values should be non-empty. Tags with empty values
        are removed from the list
        """
        return [tag for tag in tags if tag.values and len(tag.values) > 0]

    @field_validator('categories')
    @classmethod
    def validate_tag_categories(cls, cats: Optional[CategoryFilter]) -> Any:
        """Validate categories

        Categories values should be non-empty. Categories with empty values
        are removed from the list
        """
        return [cat for cat in cats if cat.values and len(cat.values) > 0]



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
    id: UUID = Field(..., description="Document UUID")
    title: str = Field(..., description="Document title")
    category: Category | None = Field(None, description="Document category")
    tags: List[Tag] = Field(default_factory=list, description="Document tags")
    custom_fields: List[CustomFieldRow] = Field(default_factory=list)
    lang: str

    owned_by: OwnedBy = Field(..., description="Owner information")
    created_at: datetime = Field(..., description="Creation timestamp")
    updated_at: datetime = Field(..., description="Last update timestamp")
    created_by: ByUser | None = Field(None, description="Created by user")
    updated_by: ByUser | None = Field(None, description="Last updated by user")

    model_config = ConfigDict(from_attributes=True)


class SearchDocumentsResponse(BaseModel):
    """
    This response includes:
    - items: List of DocumentCFV (documents with optional custom field values)
    - custom_fields: Metadata about which custom fields are included in the response
                    (empty if no custom fields are relevant to the search)
    - document_type_id: Set when exactly one document type is filtered
                       (for backwards compatibility)

    The custom_fields list in response is the union of:
    1. All custom fields from document types specified in category filters
    2. All custom fields referenced in custom_field filters
    (deduplicated by custom field ID)
    """
    items: List[DocumentCFV] = Field(..., description="Search results")
    page_number: int = Field(..., ge=1, description="Current page number")
    page_size: int = Field(..., ge=1, description="Items per page")
    num_pages: int = Field(..., ge=0, description="Total number of pages")
    total_items: int = Field(..., ge=0, description="Total number of results")

    # NEW: Custom fields metadata (union of all relevant custom fields)
    custom_fields: List[CustomFieldInfo] = Field(
        default_factory=list,
        description="Custom fields metadata included in this response"
    )

    # For backwards compatibility - set when exactly one document type is filtered
    document_type_id: Optional[UUID] = Field(
        None,
        description="Document type ID (set when filtering by exactly one category)"
    )

    model_config = ConfigDict(from_attributes=True)
