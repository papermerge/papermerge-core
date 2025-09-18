import {apiSlice} from "@/features/api/slice"

import {PAGINATION_DEFAULT_ITEMS_PER_PAGES} from "@/cconstants"

import {UserItem, UserQueryParams} from "@/features/users/types"
import type {
  ChangePassword,
  CreateUser,
  Paginated,
  User,
  UserDetails,
  UserUpdate
} from "@/types"
import type {GroupHome, GroupInbox} from "@/types.d/groups"

export const apiSliceWithUsers = apiSlice.injectEndpoints({
  endpoints: builder => ({
    getPaginatedUsers: builder.query<
      Paginated<UserItem>,
      UserQueryParams | void
    >({
      query: (params = {}) => {
        const queryString = buildQueryString(params || {})
        return `/users/?${queryString}`
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
        "User",
        ...result.items.map(({id}) => ({type: "User", id}) as const)
      ]
    }),
    getUsers: builder.query<User[], void>({
      query: _users => "/users/all",
      providesTags: (result = [], _error, _arg) => [
        "User",
        ...result.map(({id}) => ({type: "User", id}) as const)
      ]
    }),
    getUser: builder.query<UserDetails, string>({
      query: userID => `/users/${userID}`,
      providesTags: (_result, _error, arg) => [{type: "User", id: arg}]
    }),
    getUserGroupHomes: builder.query<GroupHome[], void>({
      query: _groupHomes => "/users/group-homes",
      providesTags: (result = [], _error, _arg) => [
        "GroupHome",
        ...result.map(({group_id}) => ({type: "GroupHome", group_id}) as const)
      ]
    }),
    getUserGroupInboxes: builder.query<GroupInbox[], void>({
      query: _groupHomes => "/users/group-inboxes",
      providesTags: (result = [], _error, _arg) => [
        "GroupInbox",
        ...result.map(({group_id}) => ({type: "GroupInbox", group_id}) as const)
      ]
    }),
    addNewUser: builder.mutation<User, CreateUser>({
      query: user => ({
        url: "/users/",
        method: "POST",
        body: user
      }),
      invalidatesTags: ["User"]
    }),
    editUser: builder.mutation<User, UserUpdate>({
      query: user => ({
        url: `users/${user.id}`,
        method: "PATCH",
        body: user
      }),
      invalidatesTags: (_result, _error, arg) => [{type: "User", id: arg.id}]
    }),
    deleteUser: builder.mutation<void, string>({
      query: userID => ({
        url: `users/${userID}`,
        method: "DELETE"
      }),
      invalidatesTags: (_result, _error, id) => [{type: "User", id: id}]
    }),
    changePassword: builder.mutation<void, ChangePassword>({
      query: chPwd => ({
        url: `/users/${chPwd.userId}/change-password`,
        method: "POST",
        body: chPwd
      })
    })
  })
})

export const {
  useGetPaginatedUsersQuery,
  useGetUsersQuery,
  useGetUserQuery,
  useGetUserGroupHomesQuery,
  useGetUserGroupInboxesQuery,
  useAddNewUserMutation,
  useEditUserMutation,
  useDeleteUserMutation,
  useChangePasswordMutation
} = apiSliceWithUsers

function buildQueryString(params: UserQueryParams = {}): string {
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
