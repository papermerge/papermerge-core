import {apiSlice} from "@/features/api/slice"
import type {NewRole, Paginated, PaginatedArgs, Role, RoleUpdate} from "@/types"

import {PAGINATION_DEFAULT_ITEMS_PER_PAGES} from "@/cconstants"

export const apiSliceWithRoles = apiSlice.injectEndpoints({
  endpoints: builder => ({
    getPaginatedRoles: builder.query<Paginated<Role>, PaginatedArgs | void>({
      query: ({
        page_number = 1,
        page_size = PAGINATION_DEFAULT_ITEMS_PER_PAGES
      }: PaginatedArgs) =>
        `/roles/?page_number=${page_number}&page_size=${page_size}`,
      providesTags: (
        result = {page_number: 1, page_size: 1, num_pages: 1, items: []},
        _error,
        _arg
      ) => [
        "Role",
        ...result.items.map(({id}) => ({type: "Role", id}) as const)
      ]
    }),
    getRoles: builder.query<Role[], void>({
      query: _roles => "/roles/all",
      providesTags: (result = [], _error, _arg) => [
        "Role",
        ...result.map(({id}) => ({type: "Role", id}) as const)
      ]
    }),
    getRole: builder.query<Role, string>({
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
