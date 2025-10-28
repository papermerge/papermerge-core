import {ScannerError, ScanResult, Token} from "./types"

export function scanSearchText(input: string): ScanResult {
  const tokens: Token[] = []
  const errors: ScannerError[] = []

  const trimmed = input.trim()
  if (!trimmed) {
    return {tokens, isValid: true, hasSuggestions: false}
  }

  return {
    tokens,
    isValid: true,
    hasSuggestions: false
  }
}
