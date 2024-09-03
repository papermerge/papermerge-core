import {apiSlice} from "@/features/api/slice"
import type {
  Group,
  GroupUpdate,
  Paginated,
  NewGroup,
  PaginatedArgs
} from "@/types"

import {PAGINATION_DEFAULT_ITEMS_PER_PAGES} from "@/cconstants"

export const apiSliceWithGroups = apiSlice.injectEndpoints({
  endpoints: builder => ({
    getPaginatedGroups: builder.query<Paginated<Group>, PaginatedArgs | void>({
      query: ({
        page_number = 1,
        page_size = PAGINATION_DEFAULT_ITEMS_PER_PAGES
      }: PaginatedArgs) =>
        `/groups/?page_number=${page_number}&page_size=${page_size}`,
      providesTags: (
        result = {page_number: 1, page_size: 1, num_pages: 1, items: []},
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
    getGroup: builder.query<Group, string>({
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
