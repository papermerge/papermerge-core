/**
 * Token Parser
 *
 * Parses user input into structured tokens for the advanced search feature.
 *
 * Supported syntax:
 * - Plain text: "search terms" → FTS
 * - category:value or cat:value → Category filter
 * - tag:value → Tag filter (AND logic)
 * - tag_any:value1,value2 → Tag filter (OR logic)
 * - tag_not:value → Tag filter (NOT logic)
 * - fieldname:operator value or "Field Name":operator value → Custom field filter
 *   Operators: =, !=, >, >=, <, <=, contains, icontains
 *   Note: = can be omitted for equality (e.g., total:100 means total:=100)
 *   Examples: total:>100, status:=completed, amount:100 (implies =)
 */

import type {Token, ParseResult, ParseError, OperatorType} from "./types"

// Valid operators for custom field filters
const VALID_OPERATORS: OperatorType[] = [
  "=",
  "!=",
  ">",
  ">=",
  "<",
  "<=",
  "contains",
  "icontains"
]

// Token type keywords
const TOKEN_KEYWORDS = {
  category: ["category", "cat"],
  tag: ["tag"],
  tag_any: ["tag_any"],
  tag_not: ["tag_not"]
}

/**
 * Parse user input into structured tokens
 */
export function parseTokens(input: string): ParseResult {
  const tokens: Token[] = []
  const errors: ParseError[] = []

  // Handle empty or whitespace-only input
  const trimmed = input.trim()
  if (!trimmed) {
    return {tokens: [], errors: [], isValid: true}
  }

  // Split input into segments, preserving quoted strings
  const segments = tokenizeInput(trimmed)

  // Track FTS (free text search) terms
  const ftsTerms: string[] = []

  let i = 0
  while (i < segments.length) {
    const segment = segments[i]

    // Check if this segment is a structured token (contains ':')
    if (segment.includes(":")) {
      const nextSegment = i + 1 < segments.length ? segments[i + 1] : undefined
      const result = parseStructuredToken(segment, nextSegment)

      if (result.token) {
        tokens.push(result.token)
      }

      if (result.error) {
        errors.push(result.error)
      }

      // Advance by the number of segments consumed
      i += result.consumed || 1
    } else {
      // Plain text - accumulate for FTS
      if (segment.trim()) {
        ftsTerms.push(segment.trim())
      }
      i++
    }
  }

  // Add FTS token if we have any plain text
  if (ftsTerms.length > 0) {
    tokens.unshift({
      type: "fts",
      name: "fts",
      value: ftsTerms.join(" ")
    })
  }

  return {
    tokens,
    errors,
    isValid: errors.length === 0
  }
}

/**
 * Tokenize input string, preserving quoted strings
 * Handles both quoted values AND quoted field names
 */
function tokenizeInput(input: string): string[] {
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
    if (char === " " && !inQuotes) {
      if (current.trim()) {
        segments.push(current.trim())
      }
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

/**
 * Parse a structured token (contains ':')
 * Returns both the parsed token and how many segments were consumed
 */
function parseStructuredToken(
  segment: string,
  nextSegment?: string
): {token?: Token; error?: ParseError; consumed?: number} {
  // Split by colon, but preserve quoted values
  const parts = splitByColon(segment)

  if (parts.length < 2) {
    return {
      error: {
        message: `Invalid token format: ${segment}`,
        token: segment
      },
      consumed: 1
    }
  }

  const [key, ...rest] = parts
  const keyLower = key.toLowerCase()

  // Check if it's a category token
  if (TOKEN_KEYWORDS.category.includes(keyLower)) {
    return parseCategoryToken(rest, segment, nextSegment)
  }

  // Check if it's a tag token
  if (TOKEN_KEYWORDS.tag.includes(keyLower)) {
    return parseTagToken("tag", rest, segment, nextSegment)
  }

  if (TOKEN_KEYWORDS.tag_any.includes(keyLower)) {
    return parseTagToken("tag_any", rest, segment, nextSegment)
  }

  if (TOKEN_KEYWORDS.tag_not.includes(keyLower)) {
    return parseTagToken("tag_not", rest, segment, nextSegment)
  }

  // Otherwise, try to parse as custom field
  // Check if this is a text operator (contains/icontains) that needs next segment
  const operatorAndValue = rest[0] || ""
  if (operatorAndValue === "contains" || operatorAndValue === "icontains") {
    // Text operator needs the next segment as value
    if (nextSegment) {
      const result = parseCustomFieldWithTextOperator(
        key,
        operatorAndValue as "contains" | "icontains",
        nextSegment,
        segment
      )
      return {...result, consumed: 2} // Consumed this segment and next
    } else {
      return {
        error: {
          message: `${operatorAndValue} operator requires a value`,
          token: segment
        },
        consumed: 1
      }
    }
  }

  const result = parseCustomFieldToken(key, rest, segment)
  return {...result, consumed: 1}
}

/**
 * Parse category token: category:Invoice or category:Invoice,Contract
 * Can also handle: category: Invoice (with space after colon)
 */
function parseCategoryToken(
  parts: string[],
  raw: string,
  nextSegment?: string
): {token?: Token; error?: ParseError; consumed?: number} {
  // If parts[0] is empty (space after colon), value is in nextSegment
  if (parts.length > 0 && parts[0] === "" && nextSegment) {
    const cleanValue = removeQuotes(nextSegment.trim())
    return {
      token: {
        type: "category",
        name: "category",
        value: cleanValue
      },
      consumed: 2 // Consumed this segment and next
    }
  }

  if (parts.length === 0 || !parts[0]) {
    return {
      error: {
        message: "Category value is required",
        token: raw
      },
      consumed: 1
    }
  }

  // Only use the first part (everything after first colon until end of this segment)
  const valueStr = parts[0].trim()

  // Check if multiple values (comma-separated)
  // DON'T remove outer quotes first - we need to check if there's a comma
  // For "Sales Invoice","Purchase Order", we want to split first, then remove quotes

  // First, remove outer quotes to check for comma
  const checkValue = removeQuotes(valueStr)

  if (checkValue.includes(",")) {
    // Has comma - split the ORIGINAL string (with quotes) by comma
    // This handles: "Sales Invoice","Purchase Order" or Sales Invoice,Purchase Order
    const rawValues = valueStr.split(",")
    const values = rawValues.map(v => removeQuotes(v.trim())).filter(v => v)

    return {
      token: {
        type: "category",
        name: "category",
        value: values
      },
      consumed: 1
    }
  }

  // Single value - remove quotes
  const cleanValue = removeQuotes(valueStr)

  return {
    token: {
      type: "category",
      name: "category",
      value: cleanValue
    },
    consumed: 1
  }
}

/**
 * Parse tag token: tag:urgent or tag:urgent,2024
 * Can also handle: tag: urgent (with space after colon)
 */
function parseTagToken(
  type: "tag" | "tag_any" | "tag_not",
  parts: string[],
  raw: string,
  nextSegment?: string
): {token?: Token; error?: ParseError; consumed?: number} {
  // If parts[0] is empty (space after colon), value is in nextSegment
  if (parts.length > 0 && parts[0] === "" && nextSegment) {
    const cleanValue = removeQuotes(nextSegment.trim())
    return {
      token: {
        type: type,
        name: type,
        value: cleanValue
      },
      consumed: 2
    }
  }

  if (parts.length === 0 || !parts[0]) {
    return {
      error: {
        message: `${type} value is required`,
        token: raw
      },
      consumed: 1
    }
  }

  // Only use the first part
  const valueStr = parts[0].trim()

  // Check if multiple values (comma-separated)
  // First, remove outer quotes to check for comma
  const checkValue = removeQuotes(valueStr)

  if (checkValue.includes(",")) {
    // Has comma - split the ORIGINAL string (with quotes) by comma
    const rawValues = valueStr.split(",")
    const values = rawValues.map(v => removeQuotes(v.trim())).filter(v => v)

    return {
      token: {
        type: type,
        name: type,
        value: values
      },
      consumed: 1
    }
  }

  // Single value - remove quotes
  const cleanValue = removeQuotes(valueStr)

  return {
    token: {
      type: type,
      name: type,
      value: cleanValue
    },
    consumed: 1
  }
}

/**
 * Parse custom field with text operator (contains/icontains)
 * These operators need a space and the value is in the next segment
 */
function parseCustomFieldWithTextOperator(
  fieldName: string,
  operator: "contains" | "icontains",
  valueSegment: string,
  raw: string
): {token?: Token; error?: ParseError} {
  const cleanFieldName = removeQuotes(fieldName)
  const cleanValue = removeQuotes(valueSegment.trim())

  if (!cleanValue) {
    return {
      error: {
        message: `${operator} operator requires a value`,
        token: raw
      }
    }
  }

  return {
    token: {
      type: "custom_field",
      name: cleanFieldName,
      operator: operator,
      value: cleanValue
    }
  }
}

/**
 * Parse custom field token: fieldname:operator value or "Field Name":operator value
 * Field names can be quoted if they contain spaces: "Invoice Total":>100
 * Operator = can be omitted for equality: total:100 means total:=100
 *
 * Note: Text operators (contains/icontains) are handled separately
 *
 * Examples:
 *   total:>100 → { name: 'total', operator: '>', value: '100' }
 *   status:=completed → { name: 'status', operator: '=', value: 'completed' }
 *   amount:100 → { name: 'amount', operator: '=', value: '100' }
 *   "Invoice Total":>=1000 → { name: 'Invoice Total', operator: '>=', value: '1000' }
 */
function parseCustomFieldToken(
  fieldName: string,
  parts: string[],
  raw: string
): {token?: Token; error?: ParseError} {
  if (parts.length < 1) {
    return {
      error: {
        message: `Custom field requires a value: ${raw}`,
        token: raw
      }
    }
  }

  // Remove quotes from field name if present
  const cleanFieldName = removeQuotes(fieldName)

  // The remaining part contains operator+value (no colon between them, no space)
  // Only use the first part (tokenizeInput already split by spaces)
  const operatorAndValue = parts[0]

  // Try to extract operator from the beginning of the string
  let operator: OperatorType | null = null
  let value: string = ""

  // Check for two-character operators first (>=, <=, !=)
  if (operatorAndValue.length >= 2) {
    const twoChar = operatorAndValue.substring(0, 2)
    if (twoChar === ">=" || twoChar === "<=" || twoChar === "!=") {
      operator = twoChar as OperatorType
      value = operatorAndValue.substring(2)
    }
  }

  // Check for single-character operators (>, <, =)
  if (!operator && operatorAndValue.length >= 1) {
    const oneChar = operatorAndValue[0]
    if (oneChar === ">" || oneChar === "<" || oneChar === "=") {
      operator = oneChar as OperatorType
      value = operatorAndValue.substring(1)
    }
  }

  // If no operator found, assume equality (=)
  if (!operator) {
    operator = "="
    value = operatorAndValue
  }

  // Clean up the value
  const cleanValue = removeQuotes(value.trim())

  if (!cleanValue) {
    return {
      error: {
        message: `Custom field value is required: ${raw}`,
        token: raw
      }
    }
  }

  return {
    token: {
      type: "custom_field",
      name: cleanFieldName,
      operator: operator,
      value: cleanValue
    }
  }
}

/**
 * Split string by colon, preserving quoted values
 * For custom fields, handles operator syntax without trailing colon
 * Examples:
 *   "total:>100" → ["total", ">100"]
 *   "status:=completed" → ["status", "=completed"]
 *   "total:100" → ["total", "100"] (implies =)
 */
function splitByColon(str: string): string[] {
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
function removeQuotes(str: string): string {
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
