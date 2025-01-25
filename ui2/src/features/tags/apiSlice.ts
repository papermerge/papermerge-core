import {apiSlice} from "@/features/api/slice"
import type {
  ColoredTag,
  ColoredTagUpdate,
  NewColoredTag,
  Paginated,
  PaginatedArgs
} from "@/types"

import {PAGINATION_DEFAULT_ITEMS_PER_PAGES} from "@/cconstants"

export const apiSliceWithTags = apiSlice.injectEndpoints({
  endpoints: builder => ({
    getPaginatedTags: builder.query<
      Paginated<ColoredTag>,
      PaginatedArgs | void
    >({
      query: ({
        page_number = 1,
        page_size = PAGINATION_DEFAULT_ITEMS_PER_PAGES,
        sort_by = "name",
        filter = undefined
      }: PaginatedArgs) => {
        let ret

        if (filter) {
          ret = `/tags/?page_number=${page_number}&page_size=${page_size}&order_by=${sort_by}`
          ret += `&filter=${filter}`
        } else {
          ret = `/tags/?page_number=${page_number}&page_size=${page_size}&order_by=${sort_by}`
        }

        return ret
      },
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
    getTag: builder.query<ColoredTag, string>({
      query: tagID => `/tags/${tagID}`,
      providesTags: (_result, _error, arg) => [{type: "Tag", id: arg}]
    }),
    addNewTag: builder.mutation<ColoredTag, NewColoredTag>({
      query: tag => ({
        url: "/tags/",
        method: "POST",
        body: tag
      }),
      invalidatesTags: ["Tag"]
    }),
    editTag: builder.mutation<ColoredTag, ColoredTagUpdate>({
      query: tag => ({
        url: `tags/${tag.id}`,
        method: "PATCH",
        body: tag
      }),
      invalidatesTags: (_result, _error, arg) => [{type: "Tag", id: arg.id}]
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
  useGetTagQuery,
  useEditTagMutation,
  useAddNewTagMutation,
  useDeleteTagMutation
} = apiSliceWithTags
