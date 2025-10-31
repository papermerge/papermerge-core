import type {SearchSuggestion, SuggestionType} from "./types"

interface SegmentInputResult {
  segments: string[]
  nonEmptyInputCompletedWithSpace: boolean
}

/**
 * Segment input string, preserving quoted strings
 * Handles both quoted values AND quoted field names
 * Spaces count as tokens as well.
 */
export function segmentInput(input: string): SegmentInputResult {
  const segments: string[] = []
  let current = ""
  let inQuotes = false
  let quoteChar = ""
  let nonEmptyInputCompletedWithSpace = false

  for (let i = 0; i < input.length; i++) {
    const char = input[i]
    nonEmptyInputCompletedWithSpace = false

    // Handle quote characters
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

    if (char === " " && !inQuotes && current.trim() != "") {
      segments.push(current)
      nonEmptyInputCompletedWithSpace = true
      current = ""
      continue
    }

    if (
      char != " " &&
      !inQuotes &&
      current.length > 0 &&
      current.trim() == ""
    ) {
      segments.push(current)
      current = char
      continue
    }

    current += char
  }

  // Add remaining content
  if (current) {
    segments.push(current)
  }

  return {segments, nonEmptyInputCompletedWithSpace}
}

export function isSpaceSegment(text: string): boolean {
  if (text.length == 0) {
    return true
  }

  if (text.trim() == "") {
    return true
  }

  return false
}

export function isFreeTextSegment(text: string): boolean {
  if (isSpaceSegment(text)) {
    return false
  }

  if (text.includes(":")) {
    return false
  }

  return true
}

/**
 * Split string by colon, preserving quoted values
 * For custom fields, handles operator syntax without trailing colon
 * Examples:
 *   "total:>100" → ["total", ">100"]
 *   "status:=completed" → ["status", "=completed"]
 *   "total:100" → ["total", "100"] (implies =)
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

    if (val.includes(" ")) {
      val = `"${val}"`
    }
    return prefix + val
  }

  // If val doesn't start with the last word, just append it
  if (val.includes(" ")) {
    val = `"${val}"`
  }
  return trimmed + val
}

/**
 * Returns last item from the list
 */
export function getTagValueItemsFilter(values: string): string {
  const trimmed = values.trim()
  const items = trimmed.split(",")
  const len = items.length

  return items[len - 1].trim()
}

/**
 * Returns all but last item from the list
 */
export function getTagValueItemsToExclude(values: string): string[] {
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
