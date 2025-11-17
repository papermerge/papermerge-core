import type {CustomFieldType} from "@/features/custom-fields/types"
import {CustomFieldDataType} from "@/types"

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
  | "cf" // Custom Field
  | "title"
  | "created_at"
  | "created_by"
  | "updated_at"
  | "updated_by"
  | "owner"

export type TagOperator = "any" | "all" | "not"

export type CategoryOperator = "any" | "not"

export type CustomFieldNumericOperator =
  | ">="
  | ">"
  | "="
  | "!="
  | "<"
  | "<="
  | "!="
export type CustomFieldTextOperator =
  | "!="
  | "="
  | "contains"
  | "iContains"
  | "startsWith"
  | "iStartsWith"

export type CustomFieldBooleanOperator = "=" | "!="

export type CustomFieldOperator =
  | CustomFieldNumericOperator
  | CustomFieldTextOperator
  | CustomFieldBooleanOperator

export interface BasicFilter {
  type: FilterType
  raw?: string
  operator?: string
  value?: string | number
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
  type: "cf"
  fieldName?: string
  operator?: CustomFieldOperator
  typeHandler?: CustomFieldType
  value?: string | number
}

export type Filter =
  | FreeTextFilter
  | CategoryFilter
  | TagFilter
  | CustomFieldFilter

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
