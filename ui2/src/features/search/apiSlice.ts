import {PAGINATION_DEFAULT_ITEMS_PER_PAGES} from "@/cconstants"
import {apiSlice} from "@/features/api/slice"
import {Paginated, SearchResultNode} from "@/types"

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
        `/search?q=${qs}&page_number=${page_number}&page_size=${page_size}`,
      keepUnusedDataFor: 5
    })
  })
})

export const {useGetPaginatedSearchResultsQuery} = apiSliceWithSearch
