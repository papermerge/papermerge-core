from typing import List, Optional, Any, Union
from uuid import UUID
from enum import Enum
from datetime import date
from pydantic import (
    BaseModel,
    Field,
    field_validator,
    model_validator,
    ConfigDict
)


# ============================================================================
# ENUMS
# ============================================================================

class Operator(str, Enum):
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

    model_config = ConfigDict(
        json_schema_extra={
            "examples": [
                {"values": ["Invoice"]},
                {"values": ["Blue Whale", "Green Whale"]},
                {"values": ["Annual Report, Quarterly Report"]}
            ]
        }
    )


class TagFilter(BaseModel):
    """
    Filter by tags with support for inclusion and exclusion.

    - tags: Must have ALL these tags (AND logic)
    - tags_any: Must have ANY of these tags (OR logic)
    - tags_not: Must NOT have these tags (exclusion)
    """
    tags: Optional[List[str]] = Field(
        None,
        description="Tags that must ALL be present (AND logic)",
        examples=[["urgent", "2024"]]
    )

    tags_any: Optional[List[str]] = Field(
        None,
        description="Tags where ANY must be present (OR logic)",
        examples=[["blue", "green", "red"]]
    )

    tags_not: Optional[List[str]] = Field(
        None,
        description="Tags that must NOT be present (exclusion)",
        examples=[["archived", "deleted"]]
    )

    @field_validator('tags', 'tags_any', 'tags_not')
    @classmethod
    def validate_tag_list(cls, v: Optional[List[str]]) -> Optional[List[str]]:
        """Validate and clean tag lists"""
        if v is None:
            return None

        # Remove empty strings and strip whitespace
        cleaned = [tag.strip() for tag in v if tag and tag.strip()]

        return cleaned if cleaned else None

    @model_validator(mode='after')
    def validate_at_least_one_filter(self):
        """Ensure at least one tag filter is specified"""
        if not any([self.tags, self.tags_any, self.tags_not]):
            raise ValueError('At least one of tags, tags_any, or tags_not must be specified')
        return self

    model_config = ConfigDict(
        json_schema_extra={
            "examples": [
                {"tags": ["urgent", "2024"]},
                {"tags_any": ["blue", "green"]},
                {"tags_not": ["archived"]},
                {
                    "tags": ["urgent"],
                    "tags_any": ["blue", "green"],
                    "tags_not": ["archived"]
                }
            ]
        }
    )


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

    operator: Operator = Field(
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

    def has_any_filter(self) -> bool:
        """Check if any filter is specified"""
        return any([
            self.fts is not None,
            self.category is not None,
            self.tags is not None and len(self.tags) > 0,
            self.custom_fields is not None and len(self.custom_fields) > 0
        ])

    model_config = ConfigDict(
        json_schema_extra={
            "examples": [
                {
                    "fts": {"terms": ["meeting notes"]},
                    "category": {"values": ["Invoice"]},
                    "tags": [
                        {"tags": ["urgent", "2024"]}
                    ],
                    "custom_fields": [
                        {"field_name": "total", "operator": "gt", "value": 100},
                        {"field_name": "status", "operator": "eq", "value": "completed"}
                    ]
                }
            ]
        }
    )


class SearchQueryParams(BaseModel):
    """
    Advanced search request with structured filters.

    All filters are combined with AND logic:
    - FTS AND category AND tags AND custom_fields
    """
    filters: SearchFilters = Field(
        ...,
        description="Search filters to apply"
    )

    # Optional parameters
    lang: Optional[SearchLanguage] = Field(
        None,
        description="Language for FTS (ISO 639-3 code). If not provided, uses user's preference.",
        examples=["eng", "deu", "fra", "spa"]
    )

    document_type_id: Optional[UUID] = Field(
        None,
        description="Restrict search to specific document type. "
        "If this parameter is specified then 1. `filters.category` is ignored. 2. Response "
        " will include list of custom fields of respective document type. 3. `filters.custom_fields`"
        " is looked up for custom fields filtering: referenced custom fields should much this"
        " document type."
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
    sort_by: SortBy = Field(
        default=SortBy.UPDATED_AT,
        description="Sort results by field"
    )

    sort_direction: SortDirection = Field(
        default=SortDirection.DESC,
        description="Sort direction"
    )

    @field_validator('filters')
    @classmethod
    def validate_filters_not_empty(cls, v: SearchFilters) -> SearchFilters:
        """Ensure at least one filter is specified"""
        if not v.has_any_filter():
            raise ValueError('At least one filter must be specified')
        return v

    @model_validator(mode='after')
    def validate_sort_relevance_requires_fts(self):
        """Validate that relevance sorting requires FTS filter"""
        if self.sort_by == SortBy.RELEVANCE and self.filters.fts is None:
            raise ValueError('sort_by="relevance" requires FTS filter to be specified')
        return self

    model_config = ConfigDict(
        json_schema_extra={
            "examples": [
                {
                    "filters": {
                        "fts": {"terms": ["meeting notes"]},
                        "category": {"values": ["Invoice"]},
                        "custom_fields": [
                            {"field_name": "total", "operator": "gt", "value": 100}
                        ]
                    },
                    "lang": "eng",
                    "page_size": 20,
                    "page_number": 1,
                    "sort_by": "relevance",
                    "sort_direction": "desc"
                },
                {
                    "filters": {
                        "fts": {"terms": ["urgent | important"]},
                        "tags": [
                            {"tags": ["2024"]},
                            {"tags_not": ["archived"]}
                        ]
                    },
                    "page_size": 50,
                    "page_number": 1
                }
            ]
        }
    )
