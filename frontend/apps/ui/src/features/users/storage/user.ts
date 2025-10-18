import {createSelector, createSlice} from "@reduxjs/toolkit"
import {AppStartListening} from "@/app/listenerMiddleware"
import {notifications} from "@mantine/notifications"
import {t} from "i18next"
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

// ============================================================================
// CRUD LISTENERS - Only success cases (errors handled globally)
// ============================================================================

export const userCRUDListeners = (startAppListening: AppStartListening) => {
  // Create success
  startAppListening({
    matcher: apiSliceWithUsers.endpoints.addNewUser.matchFulfilled,
    effect: async () => {
      notifications.show({
        withBorder: true,
        message: t("notifications.user.created.success", {
          defaultValue: "User created successfully"
        })
      })
    }
  })

  // Update success
  startAppListening({
    matcher: apiSliceWithUsers.endpoints.editUser.matchFulfilled,
    effect: async () => {
      notifications.show({
        withBorder: true,
        message: t("notifications.user.updated.success", {
          defaultValue: "User updated successfully"
        })
      })
    }
  })

  // Delete success
  startAppListening({
    matcher: apiSliceWithUsers.endpoints.deleteUser.matchFulfilled,
    effect: async () => {
      notifications.show({
        withBorder: true,
        message: t("notifications.user.deleted.success", {
          defaultValue: "User deleted successfully"
        })
      })
    }
  })

  // Note: Error cases are now handled by the global error middleware
  // No need for matchRejected listeners anymore!
}
