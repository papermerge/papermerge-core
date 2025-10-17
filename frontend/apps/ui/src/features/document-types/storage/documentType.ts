import {AppStartListening} from "@/app/listenerMiddleware"
import {RootState} from "@/app/types"
import {notifications} from "@mantine/notifications"
import {createSelector, createSlice} from "@reduxjs/toolkit"
import {t} from "i18next"
import {apiSliceWithDocumentTypes} from "./api"

export type DocumentTypeSlice = {}

export const initialState: DocumentTypeSlice = {}

const documentTypesSlice = createSlice({
  name: "documentTypes",
  initialState,
  reducers: {}
})

export default documentTypesSlice.reducer

export const selectDocumentTypesResult =
  apiSliceWithDocumentTypes.endpoints.getDocumentTypes.select()
export const selectItemIds = (_: RootState, itemIds: string[]) => itemIds
export const selectItemId = (_: RootState, itemId: string) => itemId

export const selectDocumentTypesById = createSelector(
  [selectDocumentTypesResult, selectItemIds],
  (documentTypesData, documentTypeIds) => {
    return documentTypesData.data?.filter(g => documentTypeIds.includes(g.id))
  }
)

export const selectDocumentTypeById = createSelector(
  [selectDocumentTypesResult, selectItemId],
  (documentTypesData, documentTypeId) => {
    return documentTypesData.data?.find(g => documentTypeId == g.id)
  }
)

export const documentTypeCRUDListeners = (
  startAppListening: AppStartListening
) => {
  // Create positive
  startAppListening({
    matcher: apiSliceWithDocumentTypes.endpoints.addDocumentType.matchFulfilled,
    effect: async () => {
      notifications.show({
        withBorder: true,
        message: t("documentTypes.notifications.created", {
          defaultValue: "Category was successfully created"
        })
      })
    }
  })

  // Update positive
  startAppListening({
    matcher:
      apiSliceWithDocumentTypes.endpoints.editDocumentType.matchFulfilled,
    effect: async () => {
      notifications.show({
        withBorder: true,
        message: t("documentTypes.notifications.updated", {
          defaultValue: "Category was successfully updated"
        })
      })
    }
  })
  // Delete positive
  startAppListening({
    matcher:
      apiSliceWithDocumentTypes.endpoints.deleteDocumentType.matchFulfilled,
    effect: async () => {
      notifications.show({
        withBorder: true,
        message: t("documentTypes.notifications.deleted", {
          defaultValue: "Category was successfully deleted"
        })
      })
    }
  })
}
