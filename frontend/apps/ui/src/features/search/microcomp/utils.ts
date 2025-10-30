/**
 * Segment input string, preserving quoted strings
 * Handles both quoted values AND quoted field names
 * Spaces count as tokens as well.
 */
export function segmentInput(input: string): string[] {
  const segments: string[] = []
  let current = ""
  let inQuotes = false
  let quoteChar = ""

  for (let i = 0; i < input.length; i++) {
    const char = input[i]

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
  if (current.trim()) {
    segments.push(current.trim())
  }

  return segments
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

/**
 * autocompleteText("this is a t", "tag") -> this is a tag
 * autocompleteText("some   te", "text") -> some   text
 */

export function autocompleteText(inputValue: string, val: string): string {
  // Trim the input value to remove trailing spaces
  const trimmed = inputValue.trimEnd()

  // Find the last word in the input (everything after the last space)
  const lastSpaceIndex = trimmed.lastIndexOf(" ")
  const lastWord =
    lastSpaceIndex === -1 ? trimmed : trimmed.substring(lastSpaceIndex + 1)

  // Check if val starts with the last word (case-insensitive comparison)
  if (val.toLowerCase().startsWith(lastWord.toLowerCase())) {
    // Replace the partial word with the complete val
    const prefix =
      lastSpaceIndex === -1 ? "" : trimmed.substring(0, lastSpaceIndex + 1)
    return prefix + val
  }

  // If val doesn't start with the last word, just append it
  return trimmed + val
}
