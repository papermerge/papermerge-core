import {createApi, fetchBaseQuery} from "@reduxjs/toolkit/query/react"
import {getBaseURL} from "@/utils"

import type {Group} from "@/types"
import type {RootState} from "@/app/types"

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

// Define our single API slice object
export const apiSlice = createApi({
  reducerPath: "api",
  baseQuery: baseQuery,
  endpoints: builder => ({
    getGroups: builder.query<Group[], void>({
      query: () => "/groups/"
    })
  })
})

// Export the auto-generated hook for the `getPosts` query endpoint
export const {useGetGroupsQuery} = apiSlice
