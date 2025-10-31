export type TokenType =
  | "fts" // Free text / full text search
  | "cat" // Category
  | "tag" // Tag
  | "cf" // Custom Field
  | "title"
  | "space"
  | "created_at"
  | "created_by"
  | "updated_at"
  | "updated_by"
  | "owner"

export type FilterType =
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

export type CustomFieldOperator = ">=" | ">" | "=" | "!=" | "<" | "<="

export interface BasicToken {
  type: TokenType
  raw?: string
  values?: string[]
}

export interface FTSToken extends BasicToken {
  type: "fts"
}

export interface CategoryToken extends BasicToken {
  type: "cat"
  operator?: CategoryOperator
}

export interface TagToken extends BasicToken {
  type: "tag"
  operator?: TagOperator
}

export interface CustomFieldToken extends BasicToken {
  type: "cf"
  operator?: CustomFieldOperator
}

export interface SpaceToken extends BasicToken {
  type: "space"
  count: number
}

export type Token =
  | FTSToken
  | CategoryToken
  | SpaceToken
  | TagToken
  | CustomFieldToken

export interface ScannerError {
  /** Error message */
  message: string

  /** The problematic token/text */
  token?: string
}

export type CurrentText = {
  value: string
}

export type SuggestionType =
  | "filter"
  | "tag"
  | "operator"
  | "category"
  | "customField"

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

export type SearchSuggestion =
  | SearchOperatorSuggestion
  | SearchTagSuggestion
  | SearchFilterSuggestion
  | SearchCategorySuggestion
  | SearchCustomFieldSuggestion

export interface ScanResult {
  /** Successfully scanned tokens */
  tokens: Token[]

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
