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

interface BasicToken {
  type: TokenType
  raw: string
}

export interface FTSToken extends BasicToken {
  type: "fts"
  values: string[]
}

export interface CategoryToken extends BasicToken {
  type: "cat"
  values: string[]
}

export type ColoredTag = {
  id: string
  fg_color: string
  bg_color: string
  name: string
}

export interface TagToken extends BasicToken {
  type: "tag"
  values: ColoredTag[]
}

export interface SpaceToken extends BasicToken {
  type: "space"
  count: number
}

export type Token = FTSToken | CategoryToken | SpaceToken | TagToken

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
  | "keyword"
  | "tag"
  | "operator"
  | "category"
  | "customField"

interface BasicSuggestion {
  type: SuggestionType
}

interface OperatorSuggestion extends BasicSuggestion {
  type: "operator"
  operators: string[]
}

interface KeywordSuggestion extends BasicSuggestion {
  type: "keyword"
  keywords: string[]
}

interface TagSuggestion extends BasicSuggestion {
  type: "tag"
  filter: string[] // user already typed part of the name
  exclude: string[] // already used in current token
}

interface CategorySuggestion extends BasicSuggestion {
  type: "category"
  filter: string[] // user already typed part of the name
  exclude: string[] // already used in current token
}

export type Suggestion =
  | OperatorSuggestion
  | TagSuggestion
  | KeywordSuggestion
  | CategorySuggestion

export interface ScanResult {
  /** Successfully scanned tokens */
  tokens: Token[]

  current?: CurrentText

  /** Any errors encountered during scanning */
  errors?: ScannerError[]

  /** Whether the scan was completely successful */
  isValid: boolean

  hasSuggestions: boolean
  suggestions?: Suggestion[]
}
