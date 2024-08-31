import {createApi, fetchBaseQuery} from "@reduxjs/toolkit/query/react"
import {getBaseURL} from "@/utils"
import {PAGINATION_DEFAULT_ITEMS_PER_PAGES} from "@/cconstants"

import type {Group, GroupUpdate, Paginated} from "@/types"
import type {RootState} from "@/app/types"

type GetGroupsArgs = {
  page_number?: number
  page_size?: number
}

const baseQuery = fetchBaseQuery({
  baseUrl: `${getBaseURL()}api`,
  prepareHeaders: (headers, {getState}) => {
    const state = getState() as RootState
    const token = state.auth.token
    const remote_user = state.auth.remote_user
    const remote_groups = state.auth.remote_groups
    const remote_name = state.auth.remote_name
    const remote_email = state.auth.remote_email

    if (token) {
      headers.set("authorization", `Bearer ${token}`)
    }

    if (remote_user) {
      headers.set("Remote-User", remote_user)
    }
    if (remote_groups) {
      headers.set("Remote-Groups", remote_groups)
    }
    if (remote_name) {
      headers.set("Remote-Name", remote_name)
    }
    if (remote_email) {
      headers.set("Remote-Email", remote_email)
    }

    headers.set("Content-Type", "application/json")

    return headers
  }
})

export const apiSlice = createApi({
  reducerPath: "api",
  baseQuery: baseQuery,
  keepUnusedDataFor: 60,
  tagTypes: ["Group"],
  endpoints: builder => ({
    getGroups: builder.query<Paginated<Group>, GetGroupsArgs | void>({
      query: ({
        page_number = 1,
        page_size = PAGINATION_DEFAULT_ITEMS_PER_PAGES
      }: GetGroupsArgs) =>
        `/groups/?page_number=${page_number}&page_size=${page_size}`,
      providesTags: (
        result = {page_number: 1, page_size: 1, num_pages: 1, items: []},
        error,
        arg
      ) => [
        "Group",
        ...result.items.map(({id}) => ({type: "Group", id}) as const)
      ]
    }),
    getGroup: builder.query<Group, string>({
      query: groupID => `/groups/${groupID}`,
      providesTags: (result, error, arg) => [{type: "Group", id: arg}]
    }),
    editGroup: builder.mutation<Group, GroupUpdate>({
      query: group => ({
        url: `groups/${group.id}`,
        method: "PATCH",
        body: group
      }),
      invalidatesTags: (result, error, arg) => [{type: "Group", id: arg.id}]
    })
  })
})

export const {useGetGroupsQuery, useGetGroupQuery, useEditGroupMutation} =
  apiSlice
