import {
  CATEGORY_IMPLICIT_OPERATOR,
  TAG_IMPLICIT_OPERATOR
} from "@/features/search/microcomp/const"
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
        if (!filters.fts) {
          filters.fts = {terms: [token.value]}
        } else {
          filters.fts.terms.push(token.value)
        }
        break

      case "cat":
        const newCat = {
          values: token.values || [],
          operator: token.operator || CATEGORY_IMPLICIT_OPERATOR
        }

        if (!filters.categories) {
          filters.categories = [newCat]
        } else {
          filters.categories.push(newCat)
        }

        break

      case "tag":
        const newTag = {
          values: token.values || [],
          operator: token.operator || TAG_IMPLICIT_OPERATOR
        }

        if (!filters.tags) {
          filters.tags = [newTag]
        } else {
          filters.tags.push(newTag)
        }

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
