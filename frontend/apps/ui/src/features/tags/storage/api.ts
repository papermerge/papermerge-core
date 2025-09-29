import {apiSlice} from "@/features/api/slice"
import type {TagItem} from "@/features/tags/types"
import {TagQueryParams} from "@/features/tags/types"
import type {
  ColoredTag,
  ColoredTagUpdate,
  NewColoredTag,
  Paginated
} from "@/types"
import type {TagDetails} from "@/types.d/tags"

import {PAGINATION_DEFAULT_ITEMS_PER_PAGES} from "@/cconstants"

export const apiSliceWithTags = apiSlice.injectEndpoints({
  endpoints: builder => ({
    getPaginatedTags: builder.query<Paginated<TagItem>, TagQueryParams | void>({
      query: (params = {}) => {
        const queryString = buildQueryString(params || {})
        return `/tags/?${queryString}`
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
      ) => ["Tag", ...result.items.map(({id}) => ({type: "Tag", id}) as const)]
    }),
    getTags: builder.query<ColoredTag[], string | undefined>({
      query: (group_id: string | undefined) => {
        if (group_id && group_id?.length > 0) {
          return `/tags/all?group_id=${group_id}`
        }
        return "/tags/all"
      },
      providesTags: (result = [], _error, _arg) => [
        "Tag",
        ...result.map(({id}) => ({type: "Tag", id}) as const)
      ]
    }),
    getTag: builder.query<TagDetails, string>({
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

function buildQueryString(params: TagQueryParams = {}): string {
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

  return searchParams.toString()
}
