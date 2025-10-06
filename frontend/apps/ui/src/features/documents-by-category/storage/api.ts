import {apiSlice} from "@/features/api/slice"
import type {
  DocumentsByCategoryQueryParams,
  RoleItem
} from "@/features/documents-by-category/types"
import type {NewRole, Paginated, Role, RoleDetails, RoleUpdate} from "@/types"

import {PAGINATION_DEFAULT_ITEMS_PER_PAGES} from "@/cconstants"

export interface GetPaginatedDocsByCatArg {
  document_type_id: string
  params: DocumentsByCategoryQueryParams
}

export const apiSliceWithDocumentsByCategory = apiSlice.injectEndpoints({
  endpoints: builder => ({
    getPaginatedDocumentsByCategory: builder.query<
      Paginated<RoleItem>,
      GetPaginatedDocsByCatArg
    >({
      query: ({document_type_id, params}) => {
        const queryString = buildQueryString(params || {})
        return `/documents/type/${document_type_id}/?${queryString}`
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
        "DocumentsByCategory",
        ...result.items.map(
          ({id}) => ({type: "DocumentsByCategory", id}) as const
        )
      ]
    }),
    getRoles: builder.query<RoleItem[], void>({
      query: _roles => "/roles/all",
      providesTags: (result = [], _error, _arg) => [
        "Role",
        ...result.map(({id}) => ({type: "Role", id}) as const)
      ]
    }),
    getAllScopes: builder.query<string[], void>({
      query: _users => "/roles/scopes/all",
      providesTags: ["Scope"]
    }),
    getRole: builder.query<RoleDetails, string>({
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
  useGetPaginatedDocumentsByCategoryQuery,
  useGetRolesQuery,
  useGetAllScopesQuery,
  useGetRoleQuery,
  useEditRoleMutation,
  useDeleteRoleMutation,
  useAddNewRoleMutation
} = apiSliceWithDocumentsByCategory

function buildQueryString(params: DocumentsByCategoryQueryParams = {}): string {
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

  if (params.filter_include_scopes) {
    searchParams.append("filter_include_scopes", params.filter_include_scopes)
  }

  if (params.filter_exclude_scopes) {
    searchParams.append("filter_exclude_scopes", params.filter_exclude_scopes)
  }

  return searchParams.toString()
}
