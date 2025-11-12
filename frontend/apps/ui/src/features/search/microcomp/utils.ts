import type {SearchSuggestion, SuggestionType} from "./types"

/**
 * Split string by colon, preserving quoted values.
 *
 * Quotes are escape characters, this means that when
 * inside quotes colon loses its syntactical meaning. This is needed
 * because titles, tags, custom fields etc may contain colon as well.
 *
 * Examples:
 *
 * 1. Examples without quotes
 *
 *     total:100 -> ['total', '100']
 *     title:has this text -> ['title', 'has this text']
 *     tag:myvalue -> ['tag', 'myvalue']
 *
 * 2. Example with colon quotes:
 *
 *    cf:"Total in Quoter: 2": 100 -> ['cf', 'Total in Quoter: 2', '100']
 *    title:"has this text with : char" -> ['title', 'has this text with : char']
 *    tag:"namespace:myvalue" -> ['tag', 'namespace:myvalue']
 *
 */
export function splitByColon(str: string): string[] {
  const parts: string[] = []
  let current = ""
  let inQuotes = false
  let quoteChar = ""

  for (let i = 0; i < str.length; i++) {
    const char = str[i]

    // Handle quotes
    if ((char === '"' || char === "'") && !inQuotes) {
      inQuotes = true
      quoteChar = char
      current += char
      continue
    }

    if (char === quoteChar && inQuotes) {
      inQuotes = false
      current += char
      quoteChar = ""
      continue
    }

    // Split on colon when not in quotes
    if (char === ":" && !inQuotes) {
      parts.push(current)
      current = ""
      continue
    }

    current += char
  }

  // Add remaining content
  parts.push(current)

  return parts
}

/**
 * Remove surrounding quotes from a string
 */
export function removeQuotes(str: string): string {
  const trimmed = str.trim()

  // Remove double quotes
  if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
    return trimmed.slice(1, -1)
  }

  // Remove single quotes
  if (trimmed.startsWith("'") && trimmed.endsWith("'")) {
    return trimmed.slice(1, -1)
  }

  return trimmed
}

export function findLongestMatchingIndex(
  inputValue: string,
  val: string
): number {
  let bestIdx = -1
  let longestMatchLength = 0

  // Try each position in inputValue as a potential starting point
  for (let i = 0; i < inputValue.length; i++) {
    // Count how many characters match between inputValue[i:] and val prefix
    let matchLength = 0
    while (
      i + matchLength < inputValue.length &&
      matchLength < val.length &&
      inputValue[i + matchLength] === val[matchLength]
    ) {
      matchLength++
    }

    // Update if this is the longest match found, or equal length (to get last occurrence)
    if (matchLength > 0 && matchLength >= longestMatchLength) {
      longestMatchLength = matchLength
      bestIdx = i
    }
  }

  return bestIdx
}

/**
 * autocompleteText("this is a t", "tag") -> this is a tag
 * autocompleteText("some   te", "text") -> some   text
 */

export function autocompleteText(inputValue: string, val: string): string {
  // Trim the input value to remove trailing spaces
  const trimmed = inputValue.trimEnd()

  // Find the last word in the input (everything after the last space)
  const longestMatchingIndex = findLongestMatchingIndex(
    trimmed.toLocaleLowerCase(),
    val.toLocaleLowerCase()
  )
  const matchingWord =
    longestMatchingIndex === -1
      ? trimmed
      : trimmed.substring(longestMatchingIndex)

  // Check if val starts with the last word (case-insensitive comparison)
  if (val.toLowerCase().startsWith(matchingWord.toLowerCase())) {
    // Replace the partial word with the complete val
    const prefix =
      longestMatchingIndex === -1
        ? ""
        : trimmed.substring(0, longestMatchingIndex)

    return prefix + val
  }

  return trimmed + val
}

/**
 * Returns last item from the list
 */
export function getTokenValueItemsFilter(values: string): string {
  const trimmed = values.trim()
  const items = trimmed.split(",")
  const len = items.length

  return items[len - 1].trim()
}

/**
 * Returns all but last item from the list
 */
export function getTokenValueItemsToExclude(values: string): string[] {
  const trimmed = values.trim()
  const items = trimmed.split(",")

  return items.slice(0, -1).map(val => removeQuotes(val))
}

interface HasTypeSuggestionArgs {
  type: SuggestionType
  suggestions?: SearchSuggestion[]
}

export function hasThisTypeSuggestion({
  type,
  suggestions
}: HasTypeSuggestionArgs): boolean {
  if (!suggestions) {
    return false
  }

  if (suggestions && suggestions.length == 0) {
    return false
  }

  for (let i = 0; i < suggestions.length; i++) {
    if (suggestions[i].type == type) {
      return true
    }
  }

  return false
}

type OperatorSymbol = "=" | "!=" | ">" | ">=" | "<" | "<="
type OperatorText = "eq" | "ne" | "gt" | "gte" | "lt" | "lte"

const SYMBOL_MAP: Record<OperatorSymbol, OperatorText> = {
  "=": "eq",
  "!=": "ne",
  ">": "gt",
  ">=": "gte",
  "<": "lt",
  "<=": "lte"
} as const

export function operatorSym2Text(sym: string): OperatorText | null {
  if (sym in SYMBOL_MAP) {
    return SYMBOL_MAP[sym as OperatorSymbol]
  }

  console.warn(`operatorSym2Text: Operator sym=${sym} not found in symbol map`)
  return null
}
