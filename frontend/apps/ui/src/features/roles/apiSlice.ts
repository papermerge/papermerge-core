import {apiSlice} from "@/features/api/slice"
import type {NewRole, Paginated, Role, RoleUpdate} from "@/types"
import type {RoleItem, RoleQueryParams} from "./types"

import {PAGINATION_DEFAULT_ITEMS_PER_PAGES} from "@/cconstants"

export const apiSliceWithRoles = apiSlice.injectEndpoints({
  endpoints: builder => ({
    getPaginatedRoles: builder.query<
      Paginated<RoleItem>,
      RoleQueryParams | void
    >({
      query: (params = {}) => {
        const queryString = buildQueryString(params || {})
        return `/roles/?${queryString}`
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
        "Role",
        ...result.items.map(({id}) => ({type: "Role", id}) as const)
      ]
    }),
    getRoles: builder.query<RoleItem[], void>({
      query: _roles => "/roles/all",
      providesTags: (result = [], _error, _arg) => [
        "Role",
        ...result.map(({id}) => ({type: "Role", id}) as const)
      ]
    }),
    getRole: builder.query<RoleItem, string>({
      query: roleID => `/roles/${roleID}`,
      providesTags: (_result, _error, arg) => [{type: "Role", id: arg}]
    }),
    addNewRole: builder.mutation<Role, NewRole>({
      query: role => ({
        url: "/roles/",
        method: "POST",
        body: role
      }),
      invalidatesTags: ["Role"]
    }),
    editRole: builder.mutation<Role, RoleUpdate>({
      query: role => ({
        url: `roles/${role.id}`,
        method: "PATCH",
        body: role
      }),
      invalidatesTags: (_result, _error, arg) => [
        {type: "Role", id: arg.id},
        "Role"
      ]
    }),
    deleteRole: builder.mutation<void, string>({
      query: roleID => ({
        url: `roles/${roleID}`,
        method: "DELETE"
      }),
      invalidatesTags: (_result, _error, id) => [{type: "Role", id: id}]
    })
  })
})

export const {
  useGetPaginatedRolesQuery,
  useGetRolesQuery,
  useGetRoleQuery,
  useEditRoleMutation,
  useDeleteRoleMutation,
  useAddNewRoleMutation
} = apiSliceWithRoles

function buildQueryString(params: RoleQueryParams = {}): string {
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
