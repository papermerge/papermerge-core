import type {CustomFieldType} from "@/features/custom-fields/types"
import {CustomFieldDataType} from "@/types"

export interface LexerResult {
  tokens: string[]
  hasTrailingSemicolon: boolean
}

export interface ParseResult {
  tokens: Token[]
  errors: string[]
  hasSuggestions: boolean
  suggestions: SearchSuggestion[]
}

export type TokenType =
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

export type FilterType =
  | "fts"
  | "title"
  | "cat"
  | "tag"
  | "cf"
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

export interface BasicToken {
  type: TokenType
  raw?: string
}

export interface FreeTextToken extends BasicToken {
  type: "fts"
  value: string
}

export interface CategoryToken extends BasicToken {
  type: "cat"
  values?: string[]
  operator?: CategoryOperator
  operatorIsImplicit?: boolean
}

export interface TagToken extends BasicToken {
  type: "tag"
  operator?: TagOperator
  operatorIsImplicit?: boolean
  values?: string[]
}

export interface CustomFieldToken extends BasicToken {
  type: "cf"
  fieldName?: string
  operator?: CustomFieldOperator
  typeHandler?: CustomFieldType
  value?: string | number
}

export type FilterToken = CategoryToken | TagToken | CustomFieldToken

export type Token = FreeTextToken | FilterToken

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
  token?: Token
  tokenIsComplete: boolean
  current?: CurrentText

  hasSuggestions: boolean
  suggestions?: SearchSuggestion[]
}

export interface ParseSegmentResult {
  token?: Token
  tokenIsComplete: boolean
  hasSuggestions: boolean
  suggestions?: SearchSuggestion[]
}

export interface SuggestionResult {
  hasSuggestions: boolean
  suggestions?: SearchSuggestion[]
  token?: Token
  tokenIsComplete: boolean
}

export interface ParseExtraData {
  typeHandler?: CustomFieldDataType
  suggestionType?: SuggestionType
}
