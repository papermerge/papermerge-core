import {
  FilterToken,
  FreeTextToken,
  ParseResult,
  SearchSuggestion,
  Token
} from "./types"
import {removeQuotes, splitByColon} from "./utils"

import {FILTERS} from "./const"

interface ParseArgs {
  input: string
  enterKey?: boolean
}

export function parse({input, enterKey = false}: ParseArgs): ParseResult {
  const tokens: Token[] = []
  const errors: string[] = []

  const trimmedInput = input.trim()

  try {
    const token = parseToken({tokenStr: input, enterKey})

    if (token) {
      tokens.push(token)
    }
  } catch (e) {
    errors.push(e as string)
  }

  const suggestions = getSuggestions(trimmedInput)
  const hasSuggestions = suggestions.length > 0

  return {
    tokens,
    errors,
    suggestions,
    hasSuggestions
  }
}

interface ParseTokenArgs {
  tokenStr: string
  enterKey?: boolean
}

function parseToken({tokenStr, enterKey}: ParseTokenArgs): Token | null {
  const parts = splitByColon(tokenStr)
  const isFTSToken = parts.length == 1

  if (isFTSToken) {
    return parseFreeTextToken({text: tokenStr, enterKey})
  }

  return parseFilterToken(tokenStr)
}

/**
 * FTS token is freely typed text
 *
 * User signals that he/she has completed typing FTS token by
 * pressing enter key
 */
interface ParseFreetextTokenArgs {
  text: string
  enterKey?: boolean
}

function parseFreeTextToken({
  text,
  enterKey = false
}: ParseFreetextTokenArgs): FreeTextToken | null {
  if (enterKey) {
    return {
      type: "fts",
      value: removeQuotes(text),
      raw: text
    }
  }

  return null
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

export function getSuggestions(text: string): SearchSuggestion[] {
  const trimmedText = text.trim()

  if (trimmedText.length == 0) {
    return [
      {
        type: "filter",
        items: FILTERS.sort()
      }
    ]
  }

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
