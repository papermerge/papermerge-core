import {AppStartListening} from "@/app/listenerMiddleware"
import {RootState} from "@/app/types"
import {notifications} from "@mantine/notifications"
import {createSelector, createSlice} from "@reduxjs/toolkit"
import {t} from "i18next"
import {apiSliceWithCustomFields} from "./api"

export type CustomFieldSlice = {}

export const initialState: CustomFieldSlice = {}

const customFieldsSlice = createSlice({
  name: "customFields",
  initialState,
  reducers: {}
})

export default customFieldsSlice.reducer

export const selectCustomFieldsResult =
  apiSliceWithCustomFields.endpoints.getCustomFields.select()
export const selectItemIds = (_: RootState, itemIds: string[]) => itemIds
export const selectItemId = (_: RootState, itemId: string) => itemId

export const selectCustomFieldsById = createSelector(
  [selectCustomFieldsResult, selectItemIds],
  (customFieldsData, customFieldIds) => {
    return customFieldsData.data?.filter(g => customFieldIds.includes(g.id))
  }
)

export const selectCustomFieldById = createSelector(
  [selectCustomFieldsResult, selectItemId],
  (customFieldsData, customFieldId) => {
    return customFieldsData.data?.find(g => customFieldId == g.id)
  }
)

export const customFieldCRUDListeners = (
  startAppListening: AppStartListening
) => {
  //create positive
  startAppListening({
    matcher:
      apiSliceWithCustomFields.endpoints.addNewCustomField.matchFulfilled,
    effect: async () => {
      notifications.show({
        withBorder: true,
        message: t("customFields.notifications.created", {
          defaultValue: "Custom field was successfully created"
        })
      })
    }
  })

  // Update positive
  startAppListening({
    matcher: apiSliceWithCustomFields.endpoints.editCustomField.matchFulfilled,
    effect: async () => {
      notifications.show({
        withBorder: true,
        message: t("customFields.notifications.updated", {
          defaultValue: "Custom field was successfully updated"
        })
      })
    }
  })
  // Delete positive
  startAppListening({
    matcher:
      apiSliceWithCustomFields.endpoints.deleteCustomField.matchFulfilled,
    effect: async () => {
      notifications.show({
        withBorder: true,
        message: t("customFields.notifications.deleted", {
          defaultValue: "Custom field was successfully deleted"
        })
      })
    }
  })
}
