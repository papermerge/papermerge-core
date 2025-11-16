import {
  FilterToken,
  FreeTextToken,
  ParseResult,
  SearchSuggestion,
  Token
} from "./types"
import {removeQuotes, splitByColon} from "./utils"

import {FILTERS} from "./const"

// ===========================
// PARSER (Syntax Analysis)
// ===========================

export function parse(input: string): ParseResult {
  const tokens: Token[] = []
  const errors: string[] = []

  const trimmedInput = input.trim()

  try {
    const token = parseToken(input)

    if (token) {
      tokens.push(token)
    }
  } catch (e) {
    errors.push(e as string)
  }

  const suggestions =
    trimmedInput.length > 0
      ? getSuggestions(trimmedInput)
      : getAllFilterSuggestions()

  return {
    tokens,
    errors,
    suggestions,
    hasSuggestions: suggestions.length > 0
  }
}

// ===========================
// TOKEN PARSER
// ===========================

function parseToken(tokenStr: string): Token | null {
  // Rule: FreeTextToken | FilterToken

  if (!tokenStr.includes(":")) {
    return parseFreeTextToken(tokenStr)
  }

  return parseFilterToken(tokenStr)
}

function parseFreeTextToken(text: string): FreeTextToken {
  return {
    type: "fts",
    value: removeQuotes(text),
    raw: text
  }
}
function parseFilterToken(tokenStr: string): FilterToken | null {
  // Rule: FilterToken ::= CustomFieldFilter | TagFilter | CategoryFilter | SimpleFilter

  const parts = splitByColon(tokenStr)
  const filters = ["cf", "tag", "cat"] as const

  const filter = parts[0]

  if (filters.includes(filter as (typeof filters)[number])) {
    return {
      type: filter as (typeof filters)[number]
    }
  }

  if (filter && parts.length > 1) {
    throw new Error(`Unknow filter name ${filter}`)
  }

  return null
}

export function getAllFilterSuggestions(): SearchSuggestion[] {
  return [
    {
      type: "filter",
      items: FILTERS.sort()
    }
  ]
}

export function getSuggestions(text: string): SearchSuggestion[] {
  const parts = splitByColon(text)

  if (parts.length == 1) {
    // Here we are outside any filter context
    // it can be either free text or prefix of filter name
    // e.g.
    //
    //  1. ta                    -> tag filter prefix
    //  2. some free text tatata -> just free text
    //  3. tag                   -> tag filter prefix
    //  4. bogota                -> just free text
    const matches = FILTERS.filter(k => k.startsWith(text))

    if (matches.length > 0) {
      return [
        {
          type: "filter",
          items: matches.sort()
        }
      ]
    }
    // user is typing just free text, nothing to suggest
    return []
  }

  return []
}
