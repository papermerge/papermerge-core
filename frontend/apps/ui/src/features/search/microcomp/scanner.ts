import {ScannerError, ScanResult, Token} from "./types"
import {segmentInput, isSpaceSegment, isFreeTextSegment} from "./utils"

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
    if (isSpaceSegment(segment)) {
      tokens.push({
        type: "space",
        count: segment.length,
        raw: segment
      })
    } else if (isFreeTextSegment(segment)) {
      const lastToken = tokens.pop()
      if (lastToken?.type == "fts") {
        lastToken.values.push(segment)
        lastToken.raw = `${lastToken.raw} ${segment}`
        tokens.push(lastToken)
      } else {
        tokens.push({
          type: "fts",
          values: [segment],
          raw: segment
        })
      }
    } else if (segment.includes(":")) {
      // tag, cf, category etc
    } else {
      // throw an exception?
    }
  }

  return {
    tokens,
    isValid: true,
    hasSuggestions: false
  }
}
