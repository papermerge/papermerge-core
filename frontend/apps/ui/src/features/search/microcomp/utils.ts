/**
 * Segment input string, preserving quoted strings
 * Handles both quoted values AND quoted field names
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

    // Split on spaces when not in quotes
    if (char === " " && !inQuotes && current.trim() != "") {
      segments.push(current)
      current = ""
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
