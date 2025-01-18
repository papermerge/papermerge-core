import {apiSlice} from "@/features/api/slice"

import {PAGINATION_DEFAULT_ITEMS_PER_PAGES} from "@/cconstants"

import type {
  ChangePassword,
  CreateUser,
  Paginated,
  PaginatedArgs,
  User,
  UserDetails,
  UserUpdate
} from "@/types"

export const apiSliceWithUsers = apiSlice.injectEndpoints({
  endpoints: builder => ({
    getPaginatedUsers: builder.query<Paginated<User>, PaginatedArgs | void>({
      query: ({
        page_number = 1,
        page_size = PAGINATION_DEFAULT_ITEMS_PER_PAGES
      }: PaginatedArgs) =>
        `/users/?page_number=${page_number}&page_size=${page_size}`,
      providesTags: (
        result = {page_number: 1, page_size: 1, num_pages: 1, items: []},
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
  useAddNewUserMutation,
  useEditUserMutation,
  useDeleteUserMutation,
  useChangePasswordMutation
} = apiSliceWithUsers
