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

      case "cat":
        // Category filter
        if (!filters.category) {
          filters.category = {values: [], operator: token.operator || "any"}
        }
        const catValues = token.values || []
        filters.category.values.push(...catValues)
        filters.category.operator = token.operator || "any"
        break

      case "tag":
        if (!filters.tags) {
          filters.tags = {
            values: [],
            operator: token.operator || "all"
          }
        }
        const tagValues = token.values || []
        filters.tags.values.push(...tagValues)
        filters.tags.operator = token.operator || "all"
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
  const categoryTokens = tokens.filter(t => t.type === "cat")

  if (categoryTokens.length !== 1) {
    return null
  }

  const values = categoryTokens[0].values || []

  if (values.length !== 1) {
    return null
  }

  return values[0]
}
