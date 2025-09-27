import {AppStartListening} from "@/app/listenerMiddleware"
import {RootState} from "@/app/types"
import {PAGINATION_DEFAULT_ITEMS_PER_PAGES} from "@/cconstants"
import type {PanelMode, ServerErrorType} from "@/types"
import type {PanelListBase} from "@/types.d/panel"
import {notifications} from "@mantine/notifications"
import {createSelector, createSlice, PayloadAction} from "@reduxjs/toolkit"
import {t} from "i18next"
import type {Pagination, SortState} from "kommon"
import {apiSliceWithDocumentTypes} from "./api"

interface DocumentTypePanelList extends PanelListBase {
  selectedIDs?: Array<string>
  withUsersFilterValue?: Array<string>
  withoutUsersFilterValue?: Array<string>
  freeTextFilterValue?: string
}

interface DocumentTypePanelDetails {
  id: string
}

export type DocumentTypeSlice = {
  mainDocumentTypeList?: DocumentTypePanelList
  secondaryDocumentTypeList?: DocumentTypePanelList
  mainDocumentTypeDetails?: DocumentTypePanelDetails
  secondaryDocumentTypeDetails?: DocumentTypePanelDetails
}

export const initialState: DocumentTypeSlice = {}

const documentTypesSlice = createSlice({
  name: "documentTypes",
  initialState,
  reducers: {
    mainPanelDocumentTypeDetailsUpdated(state, action: PayloadAction<string>) {
      const documentTypeID = action.payload
      state.mainDocumentTypeDetails = {id: documentTypeID}
    },
    secondaryPanelDocumentTypeDetailsUpdated(
      state,
      action: PayloadAction<string | undefined>
    ) {
      const documentTypeID = action.payload
      if (documentTypeID) {
        state.secondaryDocumentTypeDetails = {id: documentTypeID}
      } else {
        state.secondaryDocumentTypeDetails = undefined
      }
    },
    selectionSet: (
      state,
      action: PayloadAction<{ids: string[]; mode: PanelMode}>
    ) => {
      const {mode, ids} = action.payload
      const listKey =
        mode === "main" ? "mainDocumentTypeList" : "secondaryDocumentTypeList"

      const existingList = state[listKey]

      state[listKey] = {
        ...existingList,
        selectedIDs: ids
      }
    },
    clearSelection: (state, action: PayloadAction<{mode: PanelMode}>) => {
      const {mode} = action.payload
      const listKey =
        mode === "main" ? "mainDocumentTypeList" : "secondaryDocumentTypeList"

      const existingList = state[listKey]

      state[listKey] = {
        ...existingList,
        selectedIDs: []
      }
    },
    documentTypesTableFiltersUpdated(
      state,
      action: PayloadAction<{
        mode: PanelMode
        freeTextFilterValue?: string
        withUsersFilterValue?: string[]
        withoutUsersFilterValue?: string[]
      }>
    ) {
      const {
        mode,
        freeTextFilterValue,
        withUsersFilterValue,
        withoutUsersFilterValue
      } = action.payload
      if (mode == "main") {
        state.mainDocumentTypeList = {
          ...state.mainDocumentTypeList,
          freeTextFilterValue,
          withUsersFilterValue,
          withoutUsersFilterValue
        }
        return
      }

      state.secondaryDocumentTypeList = {
        ...state.secondaryDocumentTypeList,
        freeTextFilterValue,
        withUsersFilterValue,
        withoutUsersFilterValue
      }
    },
    documentTypePaginationUpdated(
      state,
      action: PayloadAction<{mode: PanelMode; value: Pagination}>
    ) {
      const {mode, value} = action.payload
      // initialize `newValue` with whatever is in current state
      // i.e. depending on the `mode`, use value from `mainAuditLog` or from
      // `secondaryAuditLog`
      let newValue: Pagination = {
        pageSize:
          mode == "main"
            ? state.mainDocumentTypeList?.pageSize
            : state.secondaryDocumentTypeList?.pageSize,
        pageNumber:
          mode == "main"
            ? state.mainDocumentTypeList?.pageSize
            : state.secondaryDocumentTypeList?.pageSize
      }
      // if non empty value received as parameter - use it
      // to update the state
      if (value.pageNumber) {
        newValue.pageNumber = value.pageNumber
      }

      if (value.pageSize) {
        newValue.pageSize = value.pageSize
      }

      if (mode == "main") {
        state.mainDocumentTypeList = {
          ...state.mainDocumentTypeList,
          ...newValue
        }
        return
      }

      state.secondaryDocumentTypeList = {
        ...state.secondaryDocumentTypeList,
        ...newValue
      }
    },
    documentTypePageNumberValueUpdated(
      state,
      action: PayloadAction<{mode: PanelMode; value: number}>
    ) {
      const {mode, value} = action.payload
      if (mode == "main") {
        state.mainDocumentTypeList = {
          ...state.mainDocumentTypeList,
          pageNumber: value
        }
        return
      }

      state.secondaryDocumentTypeList = {
        ...state.secondaryDocumentTypeList,
        pageNumber: value
      }
    },
    documentTypeListSortingUpdated(
      state,
      action: PayloadAction<{mode: PanelMode; value: SortState}>
    ) {
      const {mode, value} = action.payload
      if (mode == "main") {
        state.mainDocumentTypeList = {
          ...state.mainDocumentTypeList,
          sorting: value
        }
        return
      }

      state.secondaryDocumentTypeList = {
        ...state.secondaryDocumentTypeList,
        sorting: value
      }
    },
    documentTypeListVisibleColumnsUpdated(
      state,
      action: PayloadAction<{mode: PanelMode; value: Array<string>}>
    ) {
      const {mode, value} = action.payload
      if (mode == "main") {
        state.mainDocumentTypeList = {
          ...state.mainDocumentTypeList,
          visibleColumns: value
        }
        return
      }

      state.secondaryDocumentTypeList = {
        ...state.secondaryDocumentTypeList,
        visibleColumns: value
      }
    }
  }
})

export const {
  mainPanelDocumentTypeDetailsUpdated,
  secondaryPanelDocumentTypeDetailsUpdated,
  documentTypePageNumberValueUpdated,
  documentTypePaginationUpdated,
  selectionSet,
  clearSelection,
  documentTypeListSortingUpdated,
  documentTypeListVisibleColumnsUpdated,
  documentTypesTableFiltersUpdated
} = documentTypesSlice.actions
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

export const selectSelectedIDs = (state: RootState, mode: PanelMode) => {
  if (mode == "main") {
    return state.documentTypes.mainDocumentTypeList?.selectedIDs
  }

  return state.documentTypes.secondaryDocumentTypeList?.selectedIDs
}

export const selectPageSize = (state: RootState, mode: PanelMode): number => {
  if (mode == "main") {
    return (
      state.documentTypes.mainDocumentTypeList?.pageSize ||
      PAGINATION_DEFAULT_ITEMS_PER_PAGES
    )
  }

  return (
    state.documentTypes.secondaryDocumentTypeList?.pageSize ||
    PAGINATION_DEFAULT_ITEMS_PER_PAGES
  )
}

export const selectDocumentTypePageSize = (
  state: RootState,
  mode: PanelMode
) => {
  if (mode == "main") {
    return state.documentTypes.mainDocumentTypeList?.pageSize
  }

  return state.documentTypes.secondaryDocumentTypeList?.pageSize
}

export const selectDocumentTypePageNumber = (
  state: RootState,
  mode: PanelMode
) => {
  if (mode == "main") {
    return state.documentTypes.mainDocumentTypeList?.pageNumber
  }

  return state.documentTypes.secondaryDocumentTypeList?.pageNumber
}
export const selectDocumentTypeSorting = (
  state: RootState,
  mode: PanelMode
) => {
  if (mode == "main") {
    return state.documentTypes.mainDocumentTypeList?.sorting
  }

  return state.documentTypes.secondaryDocumentTypeList?.sorting
}

export const selectDocumentTypeDetailsID = (
  state: RootState,
  mode: PanelMode
) => {
  if (mode == "main") {
    return state.documentTypes.mainDocumentTypeDetails?.id
  }

  return state.documentTypes.secondaryDocumentTypeDetails?.id
}

export const selectDocumentTypeVisibleColumns = (
  state: RootState,
  mode: PanelMode
) => {
  if (mode == "main") {
    return state.documentTypes.mainDocumentTypeList?.visibleColumns
  }

  return state.documentTypes.secondaryDocumentTypeList?.visibleColumns
}

export const selectDocumentTypeFreeTextFilterValue = (
  state: RootState,
  mode: PanelMode
) => {
  if (mode == "main") {
    return state.documentTypes.mainDocumentTypeList?.freeTextFilterValue
  }

  return state.documentTypes.secondaryDocumentTypeList?.freeTextFilterValue
}

export const selectDocumentTypeWithUsersFilterValue = (
  state: RootState,
  mode: PanelMode
) => {
  if (mode == "main") {
    return state.documentTypes.mainDocumentTypeList?.withUsersFilterValue
  }

  return state.documentTypes.secondaryDocumentTypeList?.withUsersFilterValue
}

export const selectDocumentTypeWithoutUsersFilterValue = (
  state: RootState,
  mode: PanelMode
) => {
  if (mode == "main") {
    return state.documentTypes.mainDocumentTypeList?.withoutUsersFilterValue
  }

  return state.documentTypes.secondaryDocumentTypeList?.withoutUsersFilterValue
}

export const documentTypeCRUDListeners = (
  startAppListening: AppStartListening
) => {
  //create positive
  startAppListening({
    matcher: apiSliceWithDocumentTypes.endpoints.addDocumentType.matchFulfilled,
    effect: async () => {
      notifications.show({
        withBorder: true,
        message: t("notifications.goup.created.success")
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
        message: t("notifications.goup.updated.success")
      })
    }
  })
  // Update negative
  startAppListening({
    matcher: apiSliceWithDocumentTypes.endpoints.editDocumentType.matchRejected,
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
    matcher:
      apiSliceWithDocumentTypes.endpoints.deleteDocumentType.matchFulfilled,
    effect: async () => {
      notifications.show({
        withBorder: true,
        message: t("notifications.goup.deleted.success")
      })
    }
  })
  // Delete negative
  startAppListening({
    matcher:
      apiSliceWithDocumentTypes.endpoints.deleteDocumentType.matchRejected,
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
