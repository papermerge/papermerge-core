import {PAGINATION_DEFAULT_ITEMS_PER_PAGES} from "@/cconstants"
import {apiSlice} from "@/features/api/slice"
import type {Paginated} from "@/types"
import type {
  APIToken,
  APITokenCreated,
  CreateAPITokenRequest,
  DeleteAPITokenResponse,
  TokenQueryParams
} from "./types"

export const apiSliceWithTokens = apiSlice.injectEndpoints({
  endpoints: builder => ({
    getPaginatedAPITokens: builder.query<Paginated<APIToken>, TokenQueryParams>(
      {
        query: params => {
          const queryString = buildQueryString(params)
          return `/tokens?${queryString}`
        },
        providesTags: result =>
          result
            ? [
                ...result.items.map(({id}) => ({
                  type: "APIToken" as const,
                  id
                })),
                {type: "APIToken", id: "LIST"}
              ]
            : [{type: "APIToken", id: "LIST"}]
      }
    ),

    // Keep the non-paginated version for backwards compatibility
    getAPITokens: builder.query<APIToken[], void>({
      query: () => "/tokens/all",
      providesTags: result =>
        result
          ? [
              ...result.map(({id}) => ({type: "APIToken" as const, id})),
              {type: "APIToken", id: "LIST"}
            ]
          : [{type: "APIToken", id: "LIST"}]
    }),

    createAPIToken: builder.mutation<APITokenCreated, CreateAPITokenRequest>({
      query: data => ({
        url: "/tokens",
        method: "POST",
        body: data
      }),
      invalidatesTags: [{type: "APIToken", id: "LIST"}]
    }),

    deleteAPIToken: builder.mutation<DeleteAPITokenResponse, string>({
      query: tokenId => ({
        url: `/tokens/${tokenId}`,
        method: "DELETE"
      }),
      invalidatesTags: (_result, _error, id) => [
        {type: "APIToken", id},
        {type: "APIToken", id: "LIST"}
      ]
    })
  })
})

function buildQueryString(params: TokenQueryParams = {}): string {
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

  // Add filter if provided
  if (params.filter_free_text) {
    searchParams.append("filter_free_text", params.filter_free_text)
  }

  return searchParams.toString()
}

export const {
  useGetPaginatedAPITokensQuery,
  useGetAPITokensQuery,
  useCreateAPITokenMutation,
  useDeleteAPITokenMutation
} = apiSliceWithTokens
