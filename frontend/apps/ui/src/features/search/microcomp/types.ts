import type {CustomFieldType} from "@/features/custom-fields/types"
import {CustomFieldDataType, Owner} from "@/types"

export interface LexerResult {
  filters: string[]
  hasTrailingSemicolon: boolean
}

export interface ParseResult {
  filters: Filter[]
  errors: string[]
  hasSuggestions: boolean
  suggestions: SearchSuggestion[]
}

export type FilterType =
  | "fts" // Free text / full text search
  | "cat" // Category
  | "tag" // Tag
  | "md" // Metadata / Custom Field
  | "title"
  | "created_at"
  | "created_by"
  | "updated_at"
  | "updated_by"
  | "owner"

export type TagOperator = "any" | "all" | "not"

export type MultiSelectOperator = "any" | "all" | "not"

// operator for custom field of type "select"
export type SelectOperator = "eq" | "ne" | "ie" | "ine"
export type OwnerOperator = "eq" | "ne"

export type CategoryOperator = "any" | "not"

export type CustomFieldNumericOperator =
  | ">="
  | ">"
  | "="
  | "!="
  | "<"
  | "<="
  | "!="
export type NumericOperator = CustomFieldNumericOperator
export type CustomFieldTextOperator =
  | "!="
  | "="
  | "contains"
  | "iContains"
  | "startsWith"
  | "iStartsWith"

export type CustomFieldBooleanOperator = "is_checked" | "is_not_checked"

export type CustomFieldSelectOperator = "is_null" | "is_not_null"

export type CustomFieldOperator =
  | CustomFieldNumericOperator
  | CustomFieldTextOperator
  | CustomFieldBooleanOperator
  | CustomFieldSelectOperator

export interface BasicFilter {
  type: FilterType
  raw?: string
  operator?: string
  value?: string | number | Owner
  values?: string[]
}

export interface FreeTextFilter extends BasicFilter {
  type: "fts"
  value: string
}

export interface CategoryFilter extends BasicFilter {
  type: "cat"
  values?: string[]
  operator?: CategoryOperator
  operatorIsImplicit?: boolean
}

export interface TagFilter extends BasicFilter {
  type: "tag"
  operator?: TagOperator
  values?: string[]
}

export interface CustomFieldFilter extends BasicFilter {
  type: "md"
  fieldName?: string
  operator?: CustomFieldOperator
  typeHandler?: CustomFieldType
  value?: string | number
  config?: Record<any, any>
  id?: string
}

export interface CreatedAtFilter extends BasicFilter {
  type: "created_at"
  value?: string
}

export interface UpdatedAtFilter extends BasicFilter {
  type: "updated_at"
  value?: string
}

export interface CreatedByFilter extends BasicFilter {
  type: "created_by"
  value?: string
}

export interface UpdatedByFilter extends BasicFilter {
  type: "updated_by"
  value?: string
}

export interface OwnerFilter extends BasicFilter {
  type: "owner"
  value?: Owner
}

export type Filter =
  | FreeTextFilter
  | CategoryFilter
  | TagFilter
  | CustomFieldFilter
  | CreatedAtFilter
  | UpdatedAtFilter
  | CreatedByFilter
  | UpdatedByFilter
  | OwnerFilter

export type SuggestionType =
  | "filter"
  | "tag"
  | "operator"
  | "category"
  | "customField"
  | "calendarDate"

export interface SearchFilterSuggestion {
  type: "filter"
  items: string[]
}

export type SearchSuggestion = SearchFilterSuggestion

export interface ScanResult {
  token?: Filter
  tokenIsComplete: boolean

  hasSuggestions: boolean
  suggestions?: SearchSuggestion[]
}

export interface ParseSegmentResult {
  token?: Filter
  tokenIsComplete: boolean
  hasSuggestions: boolean
  suggestions?: SearchSuggestion[]
}

export interface SuggestionResult {
  hasSuggestions: boolean
  suggestions?: SearchSuggestion[]
  token?: Filter
  tokenIsComplete: boolean
}

export interface ParseExtraData {
  typeHandler?: CustomFieldDataType
  suggestionType?: SuggestionType
}
