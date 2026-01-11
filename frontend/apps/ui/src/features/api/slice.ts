import {getBaseURL} from "@/utils"
import {createApi, fetchBaseQuery} from "@reduxjs/toolkit/query/react"

import type {RootState} from "@/app/types"

const getKeepUnusedDataFor = function () {
  const keep_unused_data_for = import.meta.env.VITE_KEEP_UNUSED_DATA_FOR

  if (keep_unused_data_for == 0) {
    return 0
  }
  return keep_unused_data_for || 60
}

const baseQuery = fetchBaseQuery({
  baseUrl: `${getBaseURL()}/api`,
  prepareHeaders: (headers, {getState}) => {
    const state = getState() as RootState
    const token = state.auth.token
    const remote_user = state.auth.remote_user
    const remote_groups = state.auth.remote_groups
    const remote_roles = state.auth.remote_roles
    const remote_name = state.auth.remote_name
    const remote_email = state.auth.remote_email

    if (token) {
      headers.set("authorization", `Bearer ${token}`)
    }

    if (remote_user) {
      headers.set("X-Forwarded-User", remote_user)
    }
    if (remote_groups) {
      headers.set("X-Forwarded-Groups", remote_groups)
    }
    if (remote_roles) {
      headers.set("X-Forwarded-Roles", remote_roles)
    }
    if (remote_name) {
      headers.set("X-Forwarded-Name", remote_name)
    }
    if (remote_email) {
      headers.set("X-Forwarded-Email", remote_email)
    }

    headers.set("Content-Type", "application/json")

    return headers
  }
})

export const apiSlice = createApi({
  reducerPath: "api",
  baseQuery: baseQuery,
  keepUnusedDataFor: getKeepUnusedDataFor(),
  tagTypes: [
    "Role",
    "Scope",
    "Group",
    "GroupHome",
    "GroupInbox",
    "UserGroups",
    "User",
    "Tag",
    "APIToken",
    "Node",
    "SharedNode",
    "SharedNodeAccessDetails",
    "NodeTag", // tags fetched per node
    "Folder",
    "SharedFolder",
    "SharedDocument",
    "Document",
    "CustomField", // CRUD custom field
    "DocumentType",
    "DocumentCustomField", // custom fields associated to specific document (via document type)
    "DocumentCFV",
    "DocVersList",
    "FlatDocument",
    "DocumentVersion",
    "AuditLog",
    "PreferenceOptionTimezones",
    "PreferenceOptionDateFormats",
    "PreferenceOptionNumberFormats",
    "PreferenceOptionTimestampFormats",
    "DocumentsByCategory"
  ],
  endpoints: _ => ({})
})
