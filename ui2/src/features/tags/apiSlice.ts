import {apiSlice} from "@/features/api/slice"
import type {ColoredTag, NewColoredTag, Paginated, PaginatedArgs} from "@/types"

import {PAGINATION_DEFAULT_ITEMS_PER_PAGES} from "@/cconstants"

export const apiSliceWithTags = apiSlice.injectEndpoints({
  endpoints: builder => ({
    getPaginatedTags: builder.query<
      Paginated<ColoredTag>,
      PaginatedArgs | void
    >({
      query: ({
        page_number = 1,
        page_size = PAGINATION_DEFAULT_ITEMS_PER_PAGES
      }: PaginatedArgs) =>
        `/tags/?page_number=${page_number}&page_size=${page_size}`,
      providesTags: (
        result = {page_number: 1, page_size: 1, num_pages: 1, items: []},
        _error,
        _arg
      ) => ["Tag", ...result.items.map(({id}) => ({type: "Tag", id}) as const)]
    }),
    getTags: builder.query<ColoredTag[], void>({
      query: _tags => "/tags/all",
      providesTags: (result = [], _error, _arg) => [
        "Tag",
        ...result.map(({id}) => ({type: "Tag", id}) as const)
      ]
    }),
    addNewTag: builder.mutation<ColoredTag, NewColoredTag>({
      query: tag => ({
        url: "/tags/",
        method: "POST",
        body: tag
      }),
      invalidatesTags: ["Tag"]
    }),
    deleteTag: builder.mutation<void, string>({
      query: tagID => ({
        url: `tags/${tagID}`,
        method: "DELETE"
      }),
      invalidatesTags: (_result, _error, id) => [{type: "Tag", id: id}]
    })
  })
})

export const {
  useGetPaginatedTagsQuery,
  useGetTagsQuery,
  useAddNewTagMutation,
  useDeleteTagMutation
} = apiSliceWithTags
