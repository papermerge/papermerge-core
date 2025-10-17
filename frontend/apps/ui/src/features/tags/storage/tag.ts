import {AppStartListening} from "@/app/listenerMiddleware"
import {RootState} from "@/app/types"
import {notifications} from "@mantine/notifications"
import {createSelector, createSlice} from "@reduxjs/toolkit"
import {t} from "i18next"
import {apiSliceWithTags} from "./api"

export type TagSlice = {}

export const initialState: TagSlice = {}

const tagsSlice = createSlice({
  name: "tags",
  initialState,
  reducers: {}
})

export default tagsSlice.reducer

export const selectTagsResult = apiSliceWithTags.endpoints.getTags.select()
export const selectItemIds = (_: RootState, itemIds: string[]) => itemIds
export const selectItemId = (_: RootState, itemId: string) => itemId

export const selectTagsById = createSelector(
  [selectTagsResult, selectItemIds],
  (tagsData, tagIds) => {
    return tagsData.data?.filter(g => tagIds.includes(g.id))
  }
)

export const selectTagById = createSelector(
  [selectTagsResult, selectItemId],
  (tagsData, tagId) => {
    return tagsData.data?.find(g => tagId == g.id)
  }
)

export const tagCRUDListeners = (startAppListening: AppStartListening) => {
  //create positive
  startAppListening({
    matcher: apiSliceWithTags.endpoints.addNewTag.matchFulfilled,
    effect: async () => {
      notifications.show({
        withBorder: true,
        message: t("notifications.goup.created.success")
      })
    }
  })

  // Update positive
  startAppListening({
    matcher: apiSliceWithTags.endpoints.editTag.matchFulfilled,
    effect: async () => {
      notifications.show({
        withBorder: true,
        message: t("notifications.goup.updated.success")
      })
    }
  })
  // Delete positive
  startAppListening({
    matcher: apiSliceWithTags.endpoints.deleteTag.matchFulfilled,
    effect: async () => {
      notifications.show({
        withBorder: true,
        message: t("notifications.goup.deleted.success")
      })
    }
  })
}
