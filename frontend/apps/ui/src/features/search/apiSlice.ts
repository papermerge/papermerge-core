import {PAGINATION_DEFAULT_ITEMS_PER_PAGES} from "@/cconstants"
import {apiSlice} from "@/features/api/slice"
import {NodeType, Paginated, SearchResultNode} from "@/types"

type SearchQueryArgs = {
  qs: string
  page_number?: number
  page_size?: number
}

export const apiSliceWithSearch = apiSlice.injectEndpoints({
  endpoints: builder => ({
    getPaginatedSearchResults: builder.query<
      Paginated<SearchResultNode>,
      SearchQueryArgs
    >({
      query: ({
        qs,
        page_number = 1,
        page_size = PAGINATION_DEFAULT_ITEMS_PER_PAGES
      }: SearchQueryArgs) =>
        `/search/?q=${qs}&page_number=${page_number}&page_size=${page_size}`,
      keepUnusedDataFor: 1
    }),
    /*  Index does not store nodes' breadcrumb, tag color info.
     We need perform one extra query to get node's breadcrumb and tag color info.
    */
    getNodes: builder.query<NodeType[], string[]>({
      query: node_ids =>
        `/nodes/?${node_ids.map(i => `node_ids=${i}`).join("&")}`,
      keepUnusedDataFor: 1
    })
  })
})

export const {useGetPaginatedSearchResultsQuery, useGetNodesQuery} =
  apiSliceWithSearch
