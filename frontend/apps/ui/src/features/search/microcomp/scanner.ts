import {
  ScannerError,
  ScanResult,
  ParseLastSegmentResult,
  ParseSegmentResult,
  Token,
  TagOperator
} from "./types"
import {
  segmentInput,
  isSpaceSegment,
  isFreeTextSegment,
  splitByColon,
  removeQuotes
} from "./utils"

import {CATEGORY, TAG, TAG_IMPLICIT_OPERATOR, TAG_OP} from "./const"

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
    if (i == segment.length - 1) {
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

export function parseLastSegment(segment: string): ParseLastSegmentResult {}

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
