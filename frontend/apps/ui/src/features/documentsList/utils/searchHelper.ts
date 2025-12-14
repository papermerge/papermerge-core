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
        if (!filter.values) {
          break
        }

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

      case "md":
        const newCF = {
          field_name: filter.fieldName,
          operator: operatorSym2Text(filter.operator || "="),
          value: filter.value,
          values: filter.values
        } as CustomFieldFilter

        if (!filterList.custom_fields) {
          filterList.custom_fields = [newCF]
        } else {
          filterList.custom_fields.push(newCF)
        }
        break

      // We'll add custom_field case later
      default:
        console.warn(`Unknown filter type: ${filter}`)
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

/**
 *
 * Incomplete filters are OK for being displayed in UI.
 * However, incomplete filters should not be sent to server for searches.
 * Incomplete filters are those with missing values (or missing operator).
 * Examples:
 *
 * Incomplete Filter                            |   Complete Filter
 * -------------------------------------------------------------------------------------------------------
 *  {type: "tag", operator: "any"}              |  {type: "tag", operator: "any", values: ["blue"]}
 *  {type: "tag"}                               |  {type: "tag", operator: "all", values: ["blue", "green"]}
 *  {type: "tag", operator: "any", values: []}  |  {type: "tag", operator: "any", values: ["blue", "green"]}
 *
 * This function produces an unique string from complete tag (to be used as parameter in useEffect),
 * so that only on change of complete filters FE will send search request to BE
 */
export function uniqueSearchString(filters: Filter[]): string {
  console.log(filters)
  const onlyCompleteFilters = filters.filter(f => {
    if (f.type == "fts" && f.value) {
      return true
    }

    if (f.type == "tag" && f.values && f.values.length > 0) {
      return true
    }

    if (f.type == "cat" && f.values && f.values.length > 0) {
      return true
    }

    if (f.type == "md" && (f.value || f.values) && f.fieldName && f.operator) {
      return true
    }

    return false
  })

  const operators = onlyCompleteFilters
    .filter(f => f.operator)
    .map(f => f.operator)
  const values1 = onlyCompleteFilters.map(f => f.value)
  const values2 = onlyCompleteFilters.map(f => f.values)

  const ret = JSON.stringify({
    operators,
    values1,
    values2
  })

  return ret
}
