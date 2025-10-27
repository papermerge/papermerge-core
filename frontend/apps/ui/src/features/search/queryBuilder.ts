/**
 * Query Builder
 *
 * Converts parsed tokens into SearchQueryParams that match the backend API schema.
 *
 * Backend API expects:
 * {
 *   filters: {
 *     fts?: { terms: string[] }
 *     category?: { values: string[] }
 *     tags?: TagFilter[]
 *     custom_fields?: CustomFieldFilter[]
 *   },
 *   page_size?: number,
 *   page_number?: number,
 *   sort_by?: string,
 *   sort_direction?: string,
 *   lang?: string,
 *   document_type_id?: string
 * }
 */

import type {
  Token,
  SearchQueryParams,
  SearchFilters,
  FullTextSearchFilter,
  CategoryFilter,
  TagFilter,
  CustomFieldFilter,
  SortBy,
  SortDirection
} from "./types"

/**
 * Optional parameters for building search query
 */
export interface QueryBuilderOptions {
  page_size?: number
  page_number?: number
  sort_by?: SortBy
  sort_direction?: SortDirection
  lang?: string
  document_type_id?: string
}

/**
 * Build SearchQueryParams from parsed tokens
 */
export function buildSearchQuery(
  tokens: Token[],
  options: QueryBuilderOptions = {}
): SearchQueryParams {
  const filters: SearchFilters = {}

  // Process FTS tokens
  const ftsToken = tokens.find(t => t.type === "fts")
  if (ftsToken) {
    filters.fts = buildFTSFilter(ftsToken)
  }

  // Process category tokens
  const categoryTokens = tokens.filter(t => t.type === "category")
  if (categoryTokens.length > 0) {
    filters.category = buildCategoryFilter(categoryTokens)
  }

  // Process tag tokens
  const tagTokens = tokens.filter(
    t => t.type === "tag" || t.type === "tag_any" || t.type === "tag_not"
  )
  if (tagTokens.length > 0) {
    filters.tags = buildTagFilters(tagTokens)
  }

  // Process custom field tokens
  const customFieldTokens = tokens.filter(t => t.type === "custom_field")
  if (customFieldTokens.length > 0) {
    filters.custom_fields = buildCustomFieldFilters(customFieldTokens)
  }

  // Build final query
  const query: SearchQueryParams = {
    filters
  }

  // Add optional parameters
  if (options.page_size !== undefined) {
    query.page_size = options.page_size
  }
  if (options.page_number !== undefined) {
    query.page_number = options.page_number
  }
  if (options.sort_by) {
    query.sort_by = options.sort_by
  }
  if (options.sort_direction) {
    query.sort_direction = options.sort_direction
  }
  if (options.lang) {
    query.lang = options.lang
  }
  if (options.document_type_id) {
    query.document_type_id = options.document_type_id
  }

  return query
}

/**
 * Build FTS filter from FTS token
 * Splits the value by spaces to create an array of terms
 */
function buildFTSFilter(token: Token): FullTextSearchFilter {
  const value = Array.isArray(token.value) ? token.value.join(" ") : token.value

  // Split by whitespace and filter out empty strings
  const terms = value
    .split(/\s+/)
    .map(term => term.trim())
    .filter(term => term.length > 0)

  return {terms}
}

/**
 * Build category filter from category tokens
 * Merges multiple category tokens into a single filter
 */
function buildCategoryFilter(tokens: Token[]): CategoryFilter {
  const values: string[] = []

  for (const token of tokens) {
    if (Array.isArray(token.value)) {
      values.push(...token.value)
    } else {
      values.push(token.value)
    }
  }

  return {values}
}

/**
 * Build tag filters from tag tokens
 * Groups by tag type (tag, tag_any, tag_not) and merges same types
 */
function buildTagFilters(tokens: Token[]): TagFilter[] {
  const filters: TagFilter[] = []

  // Group tokens by type
  const tagGroups = {
    tag: tokens.filter(t => t.type === "tag"),
    tag_any: tokens.filter(t => t.type === "tag_any"),
    tag_not: tokens.filter(t => t.type === "tag_not")
  }

  // Build filter for regular tags (AND logic)
  if (tagGroups.tag.length > 0) {
    const tags: string[] = []
    for (const token of tagGroups.tag) {
      if (Array.isArray(token.value)) {
        tags.push(...token.value)
      } else {
        tags.push(token.value)
      }
    }
    filters.push({tags})
  }

  // Build filter for tag_any (OR logic)
  if (tagGroups.tag_any.length > 0) {
    const tags_any: string[] = []
    for (const token of tagGroups.tag_any) {
      if (Array.isArray(token.value)) {
        tags_any.push(...token.value)
      } else {
        tags_any.push(token.value)
      }
    }
    filters.push({tags_any})
  }

  // Build filter for tag_not (NOT logic)
  if (tagGroups.tag_not.length > 0) {
    const tags_not: string[] = []
    for (const token of tagGroups.tag_not) {
      if (Array.isArray(token.value)) {
        tags_not.push(...token.value)
      } else {
        tags_not.push(token.value)
      }
    }
    filters.push({tags_not})
  }

  return filters
}

/**
 * Build custom field filters from custom field tokens
 */
function buildCustomFieldFilters(tokens: Token[]): CustomFieldFilter[] {
  return tokens.map(token => {
    const value = Array.isArray(token.value) ? token.value[0] : token.value

    return {
      field_name: token.name,
      operator: token.operator!,
      value: convertValue(value)
    }
  })
}

/**
 * Convert string value to appropriate type (number, boolean, or string)
 */
function convertValue(value: string): string | number | boolean {
  // Handle boolean values
  if (value.toLowerCase() === "true") {
    return true
  }
  if (value.toLowerCase() === "false") {
    return false
  }

  // Try to convert to number
  // Don't convert if it has leading zeros (like "001")
  if (!/^0\d/.test(value)) {
    const num = Number(value)
    if (!isNaN(num) && value.trim() !== "") {
      return num
    }
  }

  // Keep as string
  return value
}
