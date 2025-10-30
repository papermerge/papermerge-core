import {
  ScannerError,
  ScanResult,
  ParseLastSegmentResult,
  ParseSegmentResult,
  Token,
  TagOperator,
  SuggestionResult,
  KeywordType
} from "./types"
import {
  segmentInput,
  isSpaceSegment,
  isFreeTextSegment,
  splitByColon,
  removeQuotes,
  getTagValueItemsFilter,
  getTagValueItemsToExclude
} from "./utils"

import {CATEGORY, KEYWORDS, TAG, TAG_IMPLICIT_OPERATOR, TAG_OP} from "./const"

export function scanSearchText(input: string): ScanResult {
  const tokens: Token[] = []
  const errors: ScannerError[] = []

  const trimmed = input.trim()
  if (!trimmed) {
    return {tokens, isValid: true, hasSuggestions: false}
  }

  // Split input into segments, preserving quoted strings
  const segments = segmentInput(trimmed)
  let i = 0

  while (i < segments.length) {
    const segment = segments[i]
    if (i == segments.length - 1) {
      // last segment, which may mean
      // that user is still typing it
      const {token, isValid, error, hasSuggestions, suggestions} =
        parseLastSegment(segment)
      if (isValid && token) {
        tokens.push(token)
      }
      if (!isValid && error) {
        errors.push(error)
      }

      return {
        tokens,
        errors,
        hasSuggestions,
        suggestions,
        isValid
      }
    } else {
      const {token, error, isValid} = parseSegment(segment)
      if (isValid && token) {
        tokens.push(token)
        i++
        continue
      }

      if (!isValid && error) {
        return {
          tokens,
          errors: [error],
          isValid: false,
          hasSuggestions: false
        }
      }
    }
  }

  return {
    tokens,
    isValid: true,
    hasSuggestions: false
  }
}

export function parseLastSegment(segment: string): ParseLastSegmentResult {
  if (isSpaceSegment(segment)) {
    const token = {
      type: "space" as const,
      count: segment.length,
      values: [],
      raw: segment
    }
    return {token, isValid: true, hasSuggestions: false}
  }

  if (!segment.includes(":")) {
    // user typed some non empty characters (but without a column)
    const {hasSuggestions, suggestions} = getKeywordSuggestions(segment)
    return {
      isValid: true,
      hasSuggestions,
      suggestions
    }
  }

  const parts = splitByColon(segment)
  if (parts.length == 2) {
    //cf, tag, category, title, owner etc
    const {hasSuggestions, suggestions} = getOperationSuggestion(
      parts[0] as KeywordType,
      parts[1]
    )
    return {
      isValid: true,
      hasSuggestions,
      suggestions
    }
  }

  if (parts.length == 3) {
    if (parts[0] == "tag") {
      // part[0] == "tag"
      // part[1] == any | all | not i.e. operator
      // part[2] == values:
      //
      //    1. inv
      //    2. invoice,
      //    3. "blue sky"
      //    4. "big fat invoice","blue sky",important,
      const {hasSuggestions, suggestions} = getTagValueSuggestion(parts[2])
      console.log(suggestions)
      return {
        isValid: true,
        hasSuggestions,
        suggestions
      }
    }
  }

  return {
    isValid: true,
    hasSuggestions: false
  }
}

export function parseSegment(segment: string): ParseSegmentResult {
  if (isSpaceSegment(segment)) {
    const token = {
      type: "space" as const,
      count: segment.length,
      values: [],
      raw: segment
    }
    return {token, isValid: true}
  }

  if (isFreeTextSegment(segment)) {
    const token = {
      type: "fts" as const,
      values: [segment],
      raw: segment
    }

    return {token, isValid: true}
  }

  return parseCompleteToken(segment)
}

export function parseCompleteToken(segment: string): ParseSegmentResult {
  const parts = splitByColon(segment)

  if (parts.length < 2) {
    return {
      error: {
        message: `Invalid token format: ${segment}`,
        token: segment
      },
      isValid: false
    }
  }

  const [key, ...rest] = parts
  const keyLower = key.toLowerCase()

  if (TAG == keyLower) {
    return parseTagToken(rest, segment)
  }

  if (CATEGORY == keyLower) {
    return parseCategoryToken(rest, segment)
  }

  return {
    error: {
      message: `Unknown key: ${key}`,
      token: key
    },
    isValid: false
  }
}

export function parseTagToken(
  parts: string[],
  raw: string
): ParseSegmentResult {
  if (parts.length == 0 || (parts.length == 1 && parts[0].trim() == "")) {
    return {
      error: {
        message: `Incomplete token`,
        token: raw
      },
      isValid: false
    }
  }

  if (parts.length == 2) {
    // part[0] == <operator>
    // part[1] == values
    if (!TAG_OP.includes(parts[0])) {
      return {
        error: {
          message: `Unknown operator ${parts[0]}`
        },
        isValid: false
      }
    }
    const values = parts[1].split(",").map(v => removeQuotes(v))
    return {
      token: {
        type: "tag",
        operator: parts[0] as TagOperator,
        values: values,
        raw
      },
      isValid: true
    }
  }

  // implicit operator -> TAG_OP_ALL
  //part[0] == values
  const values = parts[0].split(",").map(v => removeQuotes(v))

  return {
    token: {
      type: "tag",
      operator: TAG_IMPLICIT_OPERATOR,
      values: values,
      raw
    },
    isValid: true
  }
}

export function parseCategoryToken(
  parts: string[],
  raw: string
): ParseSegmentResult {}

export function getKeywordSuggestions(text: string): SuggestionResult {
  const matches = KEYWORDS.filter(k => k.startsWith(text))

  if (matches.length > 0) {
    return {
      hasSuggestions: true,
      suggestions: {
        type: "keyword",
        items: matches.sort()
      }
    }
  }

  return {
    hasSuggestions: false
  }
}

export function getOperationSuggestion(
  text: KeywordType,
  filter: string
): SuggestionResult {
  if (text == "tag") {
    const all_tag_operators = ["all", "any", "not"]
    const all_filtered = all_tag_operators.filter(op => op.startsWith(filter))
    const operators = filter != "" ? all_filtered : all_tag_operators
    return {
      hasSuggestions: true,
      suggestions: {
        type: "operator",
        items: operators.sort()
      }
    }
  }

  return {
    hasSuggestions: false
  }
}

export function getTagValueSuggestion(values: string): SuggestionResult {
  const trimmedValues = values.trim()
  if (trimmedValues.length == 0) {
    return {
      hasSuggestions: true,
      suggestions: {
        type: "tag"
      }
    }
  }

  const itemsToExclude = getTagValueItemsToExclude(values)
  const itemsFilter = getTagValueItemsFilter(values)

  return {
    hasSuggestions: true,
    suggestions: {
      type: "tag",
      filter: itemsFilter,
      exclude: itemsToExclude
    }
  }
}
