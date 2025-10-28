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
  type: string
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

export type ColoredToken = {
  id: string
  fg_color: string
  bg_color: string
  name: string
}

export interface TagToken extends BasicToken {
  type: "tag"
  values: ColoredToken[]
}

export interface SpaceToken extends BasicToken {
  type: "space"
  count: number
}

export type Token = FTSToken | CategoryToken | SpaceToken | TagToken

export interface ParseError {
  /** Error message */
  message: string

  /** The problematic token/text */
  token?: string
}

export type CurrentText = {
  value: string
}

interface BasicSuggestion {
  type: string
}

interface OperatorSuggestion extends BasicSuggestion {
  type: "operator"
  operators: string[]
}

interface KeywordSuggestion extends BasicSuggestion {
  type: "keyword"
  keywords: string[]
}

export type Suggestion =
  | OperatorSuggestion
  | TagSuggestion
  | KeywordSuggestion
  | CategorySuggestion

export interface ParseResult {
  /** Successfully parsed tokens */
  tokens: Token[]

  current?: CurrentText

  /** Any errors encountered during parsing */
  errors: ParseError[]

  /** Whether the parse was completely successful */
  isValid: boolean

  hasSuggestions: boolean
  suggestions: Suggestion[]
}
