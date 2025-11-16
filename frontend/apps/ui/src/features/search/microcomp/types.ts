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
  operatorIsImplicit?: boolean
  values?: string[]
}

export interface CustomFieldFilter extends BasicFilter {
  type: "cf"
  fieldName?: string
  operator?: CustomFieldOperator
  typeHandler?: CustomFieldType
  value?: string | number
}

export type FilterFilter = CategoryFilter | TagFilter | CustomFieldFilter

export type Filter = FreeTextFilter | FilterFilter

export type CurrentText = {
  value: string
}

export type SuggestionType =
  | "filter"
  | "tag"
  | "operator"
  | "category"
  | "customField"
  | "calendarDate"

export interface BasicSuggestion {
  type: SuggestionType
  items?: string[]
}

export interface SearchOperatorSuggestion extends BasicSuggestion {
  type: "operator"
}

export interface SearchFilterSuggestion extends BasicSuggestion {
  type: "filter"
}

export interface SearchTagSuggestion extends BasicSuggestion {
  type: "tag"
  filter?: string // user already typed part of the name
  exclude?: string[] // already used in current token
}

export interface SearchCategorySuggestion extends BasicSuggestion {
  type: "category"
  filter?: string // user already typed part of the name
  exclude?: string[] // already used in current token
}

export interface SearchCustomFieldSuggestion extends BasicSuggestion {
  type: "customField"
  filter?: string // user already typed part of the name
  exclude?: string[] // already used in current token
}

export interface SearchCalendarDateSuggestion extends BasicSuggestion {
  type: "calendarDate"
}

export type SearchSuggestion =
  | SearchOperatorSuggestion
  | SearchTagSuggestion
  | SearchFilterSuggestion
  | SearchCategorySuggestion
  | SearchCustomFieldSuggestion
  | SearchCalendarDateSuggestion

export interface ScanResult {
  token?: Filter
  tokenIsComplete: boolean
  current?: CurrentText

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
