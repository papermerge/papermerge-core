import {
  CATEGORY_IMPLICIT_OPERATOR,
  TAG_IMPLICIT_OPERATOR
} from "@/features/search/microcomp/const"
import type {Filter} from "@/features/search/microcomp/types"
import {operatorSym2Text} from "@/features/search/microcomp/utils"
import type {
  CustomFieldFilter,
  SearchQueryParams
} from "@/features/search/types"
import type {SortState} from "kommon"

interface BuildSearchParamsArgs {
  filters: Filter[]
  pageNumber: number
  pageSize: number
  sorting?: SortState | null
}

export function buildSearchQueryParams({
  filters,
  pageNumber,
  pageSize,
  sorting
}: BuildSearchParamsArgs): SearchQueryParams {
  const filterList: SearchQueryParams["filters"] = {}

  // Process each filter
  for (const filter of filters) {
    switch (filter.type) {
      case "fts":
        if (!filterList.fts) {
          filterList.fts = {terms: [filter.value]}
        } else {
          filterList.fts.terms.push(filter.value)
        }
        break

      case "cat":
        const newCat = {
          values: filter.values || [],
          operator: filter.operator || CATEGORY_IMPLICIT_OPERATOR
        }

        if (!filterList.categories) {
          filterList.categories = [newCat]
        } else {
          filterList.categories.push(newCat)
        }

        break

      case "tag":
        const newTag = {
          values: filter.values || [],
          operator: filter.operator || TAG_IMPLICIT_OPERATOR
        }

        if (!filterList.tags) {
          filterList.tags = [newTag]
        } else {
          filterList.tags.push(newTag)
        }

        break

      case "cf":
        const newCF = {
          field_name: filter.fieldName,
          operator: operatorSym2Text(filter.operator || "="),
          value: filter.value
        } as CustomFieldFilter

        if (!filterList.custom_fields) {
          filterList.custom_fields = [newCF]
        } else {
          filterList.custom_fields.push(newCF)
        }

      // We'll add custom_field case later
      default:
        console.warn(`Unknown filter type: ${filter.type}`)
    }
  }

  return {
    filters: filterList,
    page_number: pageNumber,
    page_size: pageSize,
    sort_by: sorting?.column || undefined,
    sort_direction: sorting?.direction || undefined
  }
}

/**
 * Extract document_type_id from category filter if exactly one category is specified
 */
export function extractSingleCategoryId(filters: Filter[]): string | null {
  const categoryFilters = filters.filter(t => t.type === "cat")

  if (categoryFilters.length !== 1) {
    return null
  }

  const values = categoryFilters[0].values || []

  if (values.length !== 1) {
    return null
  }

  return values[0]
}
