import {createSelector, createSlice} from "@reduxjs/toolkit"
import {apiSliceWithUsers} from "./api"

import {RootState} from "@/app/types"

export type UserSlice = {}

export const initialState: UserSlice = {}

const usersSlice = createSlice({
  name: "users",
  initialState,
  reducers: {}
})

export default usersSlice.reducer

export const selectUsersResult = apiSliceWithUsers.endpoints.getUsers.select()
export const selectItemIds = (_: RootState, itemIds: string[]) => itemIds
export const selectItemId = (_: RootState, itemId: string) => itemId

export const selectUsersById = createSelector(
  [selectUsersResult, selectItemIds],
  (usersData, userIds) => {
    return usersData.data?.filter(u => userIds.includes(u.id))
  }
)

export const selectUserById = createSelector(
  [selectUsersResult, selectItemId],
  (usersData, userId) => {
    return usersData.data?.find(u => userId == u.id)
  }
)
