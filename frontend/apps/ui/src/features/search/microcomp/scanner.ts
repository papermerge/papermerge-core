import {ScannerError, ScanResult, Token} from "./types"
import {segmentInput, isSpaceSegment} from "./utils"

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
    }
  }

  return {
    tokens,
    isValid: true,
    hasSuggestions: false
  }
}
