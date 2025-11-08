import type {Token} from "@/features/search/microcomp/types"
import type {SearchQueryParams} from "@/features/search/types"
import type {SortState} from "kommon"

interface BuildSearchParamsArgs {
  tokens: Token[]
  pageNumber: number
  pageSize: number
  sorting?: SortState | null
}

export function buildSearchQueryParams({
  tokens,
  pageNumber,
  pageSize,
  sorting
}: BuildSearchParamsArgs): SearchQueryParams {
  const filters: SearchQueryParams["filters"] = {}

  // Process each token
  for (const token of tokens) {
    switch (token.type) {
      case "fts":
        // Full-text search
        if (!filters.fts) {
          filters.fts = {terms: []}
        }
        const terms = Array.isArray(token.value) ? token.value : [token.value]
        filters.fts.terms.push(...terms)
        break

      case "category":
        // Category filter
        if (!filters.category) {
          filters.category = {values: []}
        }
        const categories = Array.isArray(token.value)
          ? token.value
          : [token.value]
        filters.category.values.push(...categories)
        break

      case "tag":
        // Tag filter (AND logic - must have all)
        if (!filters.tags) {
          filters.tags = []
        }
        const tagsAll = Array.isArray(token.value) ? token.value : [token.value]
        filters.tags.push({tags: tagsAll})
        break

      case "tag_any":
        // Tag filter (OR logic - must have any)
        if (!filters.tags) {
          filters.tags = []
        }
        const tagsAny = Array.isArray(token.value) ? token.value : [token.value]
        filters.tags.push({tags_any: tagsAny})
        break

      case "tag_not":
        // Tag filter (NOT logic - must not have)
        if (!filters.tags) {
          filters.tags = []
        }
        const tagsNot = Array.isArray(token.value) ? token.value : [token.value]
        filters.tags.push({tags_not: tagsNot})
        break

      // We'll add custom_field case later
      default:
        console.warn(`Unknown token type: ${token.type}`)
    }
  }

  return {
    filters,
    page_number: pageNumber,
    page_size: pageSize,
    sort_by: sorting?.column || undefined,
    sort_direction: sorting?.direction || undefined
  }
}

/**
 * Extract document_type_id from category filter if exactly one category is specified
 */
export function extractSingleCategoryId(tokens: Token[]): string | null {
  const categoryTokens = tokens.filter(t => t.type === "category")

  if (categoryTokens.length !== 1) {
    return null
  }

  const values = Array.isArray(categoryTokens[0].value)
    ? categoryTokens[0].value
    : [categoryTokens[0].value]

  if (values.length !== 1) {
    return null
  }

  return values[0]
}
