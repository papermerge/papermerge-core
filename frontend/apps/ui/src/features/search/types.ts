/**
 * Token Search Types
 *
 * These types define the structure of tokens, search queries,
 * and API payloads for the advanced token-based search feature.
 */

// ============================================================================
// Token Types
// ============================================================================

export type TokenType =
  | "fts" // Full-text search
  | "category" // Category filter
  | "tag" // Tag filter (must have - AND logic)
  | "tag_any" // Tag filter (any of - OR logic)
  | "tag_not" // Tag filter (must not have - NOT logic)
  | "custom_field" // Custom field filter

export type OperatorType =
  | "=" // equals
  | "!=" // not equals
  | ">" // greater than
  | ">=" // greater than or equal
  | "<" // less than
  | "<=" // less than or equal
  | "contains" // contains (for text)
  | "icontains" // case-insensitive contains

/**
 * Represents a parsed token from user input
 */
export interface Token {
  type: TokenType

  /** The token name/key (e.g., "category", "tag", "total") */
  name: string
  alias?: string // e.g. tany or tagany for tag_any,

  /** Operator for custom fields (e.g., "gt", "eq") */
  operator?: OperatorType

  /** The value(s) for the token */
  value: string | string[]

  /** Original raw text for this token */
  raw?: string
}

// ============================================================================
// Autocomplete Types
// ============================================================================

export type SuggestionType =
  | "token" // Token name suggestion (category:, tag:, etc.)
  | "category" // Category value suggestion
  | "tag" // Tag value suggestion
  | "custom_field" // Custom field name suggestion
  | "operator" // Operator suggestion (gt:, eq:, etc.)
  | "value" // Value suggestion

export interface Suggestion {
  /** The text to insert/complete */
  value: string

  /** Display label (can be different from value) */
  label: string

  /** Type of suggestion */
  type: SuggestionType

  /** Optional description for the suggestion */
  description?: string

  /** Optional icon or indicator */
  icon?: string
}

// ============================================================================
// API Payload Types (matches backend schema)
// ============================================================================

export interface FullTextSearchFilter {
  terms: string[]
}

export interface CategoryFilter {
  values: string[]
}

export interface TagFilter {
  tags?: string[] // AND logic - must have all
  tags_any?: string[] // OR logic - must have any
  tags_not?: string[] // NOT logic - must not have
}

export interface CustomFieldFilter {
  field_name: string
  operator: OperatorType
  value: string | number | boolean
}

export interface SearchFilters {
  fts?: FullTextSearchFilter
  category?: CategoryFilter
  tags?: TagFilter[]
  custom_fields?: CustomFieldFilter[]
}

export type SortBy = "created_at" | "updated_at" | "title" | "size"
export type SortDirection = "asc" | "desc"

/**
 * Complete search query parameters for API
 */
export interface SearchQueryParams {
  filters: SearchFilters

  // Optional parameters
  lang?: string
  document_type_id?: string

  // Pagination
  page_size?: number
  page_number?: number

  // Sorting
  sort_by?: SortBy
  sort_direction?: SortDirection
}

// ============================================================================
// Parser Configuration
// ============================================================================

export interface ParserConfig {
  /** Available category names for autocomplete */
  availableCategories?: string[]

  /** Available tag names for autocomplete */
  availableTags?: string[]

  /** Available custom fields for autocomplete */
  availableCustomFields?: CustomFieldMetadata[]
}

// ============================================================================
// Parse Result
// ============================================================================
export type InputType =
  | "tagName"
  | "categoryName"
  | "customFieldName"
  | "operator"
  | "value"
  | "dateValue"
  | "timestampValue"

export interface RequiredInput {
  type: InputType
}

export interface ParseResult {
  /** Successfully parsed tokens */
  tokens: Token[]

  isComplete: boolean
  requiredInput?: RequiredInput

  /** Any errors encountered during parsing */
  errors: ParseError[]

  /** Whether the parse was completely successful */
  isValid: boolean
}

export interface ParseError {
  /** Error message */
  message: string

  /** Position in the input string where error occurred */
  position?: number

  /** The problematic token/text */
  token?: string
}

/**
 * Represents a parsed token from user input
 */
export interface Token {
  type: TokenType
  name: string // The token name/key (e.g., "category", "tag", "total")
  operator?: OperatorType // Operator for custom fields
  value: string | string[] // The value(s) for the token
  raw?: string // Original raw text for this token
}

export interface Suggestion {
  value: string // The text to insert/complete
  label: string // Display label (can be different from value)
  type: SuggestionType // Type of suggestion
  description?: string // Optional description
  icon?: string // Optional icon or indicator
  metadata?: any // Additional metadata (e.g., custom field type)
}

/**
 * Custom Field Metadata (for determining operators)
 */
export interface CustomFieldMetadata {
  id: string
  name: string
  type_handler: CustomFieldType
  config?: Record<string, any>
}

export type CustomFieldType =
  | "text"
  | "integer"
  | "number"
  | "date"
  | "datetime"
  | "boolean"
  | "monetary"
  | "yearmonth"
  | "select"
  | "multiselect"
  | "url"
  | "email"

/**
 * Parser state for tracking current input context
 */
export interface ParserState {
  currentToken?: Partial<Token>
  expectingValue: boolean
  expectingOperator: boolean
  selectedCategory?: string // For filtering custom fields by category
}

/**
 * API Payload Types (matches backend schema)
 */
export interface FullTextSearchFilter {
  terms: string[]
}

export interface CategoryFilter {
  values: string[]
}

export interface TagFilter {
  tags?: string[] // AND logic - must have all
  tags_any?: string[] // OR logic - must have any
  tags_not?: string[] // NOT logic - must not have
}

export interface CustomFieldFilter {
  field_name: string
  operator: OperatorType
  value: string | number | boolean
}

export interface SearchFilters {
  fts?: FullTextSearchFilter
  category?: CategoryFilter
  tags?: TagFilter[]
  custom_fields?: CustomFieldFilter[]
}

export interface SearchQueryParams {
  filters: SearchFilters
  lang?: string
  document_type_id?: string
  page_size?: number
  page_number?: number
  sort_by?: SortBy
  sort_direction?: "asc" | "desc"
}

/**
 * Token keyword definitions
 */
export const TOKEN_KEYWORDS = {
  TAG: ["tag:", "tag"],
  TAG_ANY: ["tag_any:", "tag_any"],
  TAG_NOT: ["tag_not:", "tag_not"],
  CATEGORY: ["category:", "cat:", "category", "cat"],
  CUSTOM_FIELD: ["cf:", "custom_field:", "cf", "custom_field"]
} as const

/**
 * Operator definitions by field type
 */
export const OPERATORS_BY_TYPE: Record<CustomFieldType, OperatorType[]> = {
  text: ["=", "!=", "contains", "icontains"],
  integer: ["=", "!=", ">", ">=", "<", "<="],
  number: ["=", "!=", ">", ">=", "<", "<="],
  date: ["=", "!=", ">", ">=", "<", "<="],
  datetime: ["=", "!=", ">", ">=", "<", "<="],
  boolean: ["=", "!="],
  monetary: ["=", "!=", ">", ">=", "<", "<="],
  yearmonth: ["=", "!=", ">", ">=", "<", "<="],
  select: ["=", "!="],
  multiselect: ["contains"],
  url: ["=", "!=", "contains"],
  email: ["=", "!=", "contains"]
}
