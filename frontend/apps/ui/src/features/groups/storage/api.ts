import {apiSlice} from "@/features/api/slice"
import type {GroupItem} from "@/features/groups/types"
import type {Paginated} from "@/types"
import type {Group, GroupDetails, GroupUpdate, NewGroup} from "@/types.d/groups"

import {PAGINATION_DEFAULT_ITEMS_PER_PAGES} from "@/cconstants"
import {GroupQueryParams} from "@/features/groups/types"

export const apiSliceWithGroups = apiSlice.injectEndpoints({
  endpoints: builder => ({
    getPaginatedGroups: builder.query<
      Paginated<GroupItem>,
      GroupQueryParams | void
    >({
      query: (params = {}) => {
        const queryString = buildQueryString(params || {})
        return `/groups/?${queryString}`
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
        "Group",
        ...result.items.map(({id}) => ({type: "Group", id}) as const)
      ]
    }),
    getGroups: builder.query<Group[], void>({
      query: _groups => "/groups/all",
      providesTags: (result = [], _error, _arg) => [
        "Group",
        ...result.map(({id}) => ({type: "Group", id}) as const)
      ]
    }),
    getGroup: builder.query<GroupDetails, string>({
      query: groupID => `/groups/${groupID}`,
      providesTags: (_result, _error, arg) => [{type: "Group", id: arg}]
    }),
    addNewGroup: builder.mutation<Group, NewGroup>({
      query: group => ({
        url: "/groups/",
        method: "POST",
        body: group
      }),
      invalidatesTags: ["Group"]
    }),
    editGroup: builder.mutation<Group, GroupUpdate>({
      query: group => ({
        url: `groups/${group.id}`,
        method: "PATCH",
        body: group
      }),
      invalidatesTags: (_result, _error, arg) => [{type: "Group", id: arg.id}]
    }),
    deleteGroup: builder.mutation<void, string>({
      query: groupID => ({
        url: `groups/${groupID}`,
        method: "DELETE"
      }),
      invalidatesTags: (_result, _error, id) => [{type: "Group", id: id}]
    })
  })
})

export const {
  useGetPaginatedGroupsQuery,
  useGetGroupsQuery,
  useGetGroupQuery,
  useEditGroupMutation,
  useDeleteGroupMutation,
  useAddNewGroupMutation
} = apiSliceWithGroups

function buildQueryString(params: GroupQueryParams = {}): string {
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

  if (params.filter_with_users) {
    searchParams.append("filter_with_users", params.filter_with_users)
  }

  if (params.filter_without_users) {
    searchParams.append("filter_without_users", params.filter_without_users)
  }

  return searchParams.toString()
}
