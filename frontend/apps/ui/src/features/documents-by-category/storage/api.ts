import {apiSlice} from "@/features/api/slice"
import type {
  DocumentByCategoryItem,
  DocumentsByCategoryQueryParams,
  FlatDocument
} from "@/features/documents-by-category/types"
import type {SearchQueryParams} from "@/features/search/types"
import type {Paginated} from "@/types"

export interface SearchDocumentsResponse {
  items: FlatDocument[]
  page_number: number
  page_size: number
  num_pages: number
  total_items: number
}

import {PAGINATION_DEFAULT_ITEMS_PER_PAGES} from "@/cconstants"

export type FlatDocumentSortBy =
  | "id"
  | "title"
  | "created_at"
  | "updated_at"
  | "created_by"
  | "updated_by"
  | "owned_by"

export interface FlatDocumentsQueryParams {
  page_number?: number
  page_size?: number
  sort_by?: FlatDocumentSortBy
  sort_direction?: "asc" | "desc"
  filter_free_text?: string
  filter_title?: string
  filter_created_by_username?: string
  filter_updated_by_username?: string
}

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
    }), // getPaginatedDocumentsByCategory
    getPaginatedFlatDocuments: builder.query<
      Paginated<FlatDocument>,
      FlatDocumentsQueryParams | void
    >({
      query: (params = {}) => {
        const queryString = buildFlatDocumentsQueryString(params || {})
        return `/documents/?${queryString}`
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
        "FlatDocument",
        ...result.items.map(({id}) => ({type: "FlatDocument", id}) as const)
      ]
    }),
    searchDocuments: builder.mutation<
      SearchDocumentsResponse,
      SearchQueryParams
    >({
      query: params => ({
        url: "/search",
        method: "POST",
        body: params
      }),
      invalidatesTags: ["FlatDocument"]
    })
  }) // endpoint
})

export const {
  useGetPaginatedDocumentsByCategoryQuery,
  useGetPaginatedFlatDocumentsQuery,
  useSearchDocumentsMutation
} = apiSliceWithDocumentsByCategory

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

function buildFlatDocumentsQueryString(
  params: FlatDocumentsQueryParams = {}
): string {
  const searchParams = new URLSearchParams()

  searchParams.append("page_number", String(params.page_number || 1))
  searchParams.append(
    "page_size",
    String(params.page_size || PAGINATION_DEFAULT_ITEMS_PER_PAGES)
  )

  if (params.sort_by) {
    searchParams.append("sort_by", params.sort_by)
  }
  if (params.sort_direction) {
    searchParams.append("sort_direction", params.sort_direction)
  }
  if (params.filter_free_text) {
    searchParams.append("filter_free_text", params.filter_free_text)
  }
  if (params.filter_title) {
    searchParams.append("filter_title", params.filter_title)
  }
  if (params.filter_created_by_username) {
    searchParams.append(
      "filter_created_by_username",
      params.filter_created_by_username
    )
  }
  if (params.filter_updated_by_username) {
    searchParams.append(
      "filter_updated_by_username",
      params.filter_updated_by_username
    )
  }

  return searchParams.toString()
}
