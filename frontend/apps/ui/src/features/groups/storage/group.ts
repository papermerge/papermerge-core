import {AppStartListening} from "@/app/listenerMiddleware"
import {RootState} from "@/app/types"
import type {ServerErrorType} from "@/types"
import {notifications} from "@mantine/notifications"
import {createSelector, createSlice} from "@reduxjs/toolkit"
import {t} from "i18next"
import {apiSliceWithGroups} from "./api"

export type GroupSlice = {}

export const initialState: GroupSlice = {}

const groupsSlice = createSlice({
  name: "groups",
  initialState,
  reducers: {}
})

export default groupsSlice.reducer

export const selectGroupsResult =
  apiSliceWithGroups.endpoints.getGroups.select()
export const selectItemIds = (_: RootState, itemIds: string[]) => itemIds
export const selectItemId = (_: RootState, itemId: string) => itemId

export const selectGroupsById = createSelector(
  [selectGroupsResult, selectItemIds],
  (groupsData, groupIds) => {
    return groupsData.data?.filter(g => groupIds.includes(g.id))
  }
)

export const selectGroupById = createSelector(
  [selectGroupsResult, selectItemId],
  (groupsData, groupId) => {
    return groupsData.data?.find(g => groupId == g.id)
  }
)

export const groupCRUDListeners = (startAppListening: AppStartListening) => {
  //create positive
  startAppListening({
    matcher: apiSliceWithGroups.endpoints.addNewGroup.matchFulfilled,
    effect: async () => {
      notifications.show({
        withBorder: true,
        message: t("notifications.goup.created.success")
      })
    }
  })

  // Update positive
  startAppListening({
    matcher: apiSliceWithGroups.endpoints.editGroup.matchFulfilled,
    effect: async () => {
      notifications.show({
        withBorder: true,
        message: t("notifications.goup.updated.success")
      })
    }
  })
  // Update negative
  startAppListening({
    matcher: apiSliceWithGroups.endpoints.editGroup.matchRejected,
    effect: async action => {
      const error = action.payload as ServerErrorType
      notifications.show({
        autoClose: false,
        withBorder: true,
        color: "red",
        title: t("notifications.common.error"),
        message: error.data.detail
      })
    }
  })
  // Delete positive
  startAppListening({
    matcher: apiSliceWithGroups.endpoints.deleteGroup.matchFulfilled,
    effect: async () => {
      notifications.show({
        withBorder: true,
        message: t("notifications.goup.deleted.success")
      })
    }
  })
  // Delete negative
  startAppListening({
    matcher: apiSliceWithGroups.endpoints.deleteGroup.matchRejected,
    effect: async action => {
      const error = action.payload as ServerErrorType
      notifications.show({
        autoClose: false,
        withBorder: true,
        color: "red",
        title: t("notifications.common.error"),
        message: error.data.detail
      })
    }
  })
}
