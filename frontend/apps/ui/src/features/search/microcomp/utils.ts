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
