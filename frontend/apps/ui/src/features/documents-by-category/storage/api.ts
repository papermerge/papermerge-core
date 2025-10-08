import {apiSlice} from "@/features/api/slice"
import type {
  DocumentByCategoryItem,
  DocumentsByCategoryQueryParams
} from "@/features/documents-by-category/types"
import type {Paginated} from "@/types"

import {PAGINATION_DEFAULT_ITEMS_PER_PAGES} from "@/cconstants"

export interface GetPaginatedDocsByCatArg {
  document_type_id: string
  params: DocumentsByCategoryQueryParams
}

export const apiSliceWithDocumentsByCategory = apiSlice.injectEndpoints({
  endpoints: builder => ({
    getPaginatedDocumentsByCategory: builder.query<
      Paginated<DocumentByCategoryItem>,
      GetPaginatedDocsByCatArg
    >({
      query: ({document_type_id, params}) => {
        const queryString = buildQueryString(params || {})
        return `/documents/type/${document_type_id}/?${queryString}`
      },
      providesTags: (
        result = {
          page_number: 1,
          page_size: 1,
          num_pages: 1,
          items: [],
          total_items: 1
        },
        _error,
        _arg
      ) => [
        "DocumentsByCategory",
        ...result.items.map(
          ({id}) => ({type: "DocumentsByCategory", id}) as const
        )
      ]
    })
  })
})

export const {useGetPaginatedDocumentsByCategoryQuery} =
  apiSliceWithDocumentsByCategory

function buildQueryString(params: DocumentsByCategoryQueryParams = {}): string {
  const searchParams = new URLSearchParams()

  // Always include pagination with defaults
  searchParams.append("page_number", String(params.page_number || 1))
  searchParams.append(
    "page_size",
    String(params.page_size || PAGINATION_DEFAULT_ITEMS_PER_PAGES)
  )

  // Add sorting if provided
  if (params.sort_by) {
    searchParams.append("sort_by", params.sort_by)
  }
  if (params.sort_direction) {
    searchParams.append("sort_direction", params.sort_direction)
  }

  if (params.filter_free_text) {
    searchParams.append("filter_free_text", params.filter_free_text)
  }

  if (params.filter_include_scopes) {
    searchParams.append("filter_include_scopes", params.filter_include_scopes)
  }

  if (params.filter_exclude_scopes) {
    searchParams.append("filter_exclude_scopes", params.filter_exclude_scopes)
  }

  return searchParams.toString()
}
