import {AppStartListening} from "@/app/listenerMiddleware"
import {RootState} from "@/app/types"
import {PAGINATION_DEFAULT_ITEMS_PER_PAGES} from "@/cconstants"
import type {PanelMode} from "@/types"
import type {PanelListBase} from "@/types.d/panel"
import {notifications} from "@mantine/notifications"
import {createSelector, createSlice, PayloadAction} from "@reduxjs/toolkit"
import {t} from "i18next"
import type {Pagination, SortState} from "kommon"
import {apiSliceWithCustomFields} from "./api"

interface CustomFieldPanelList extends PanelListBase {
  selectedIDs?: Array<string>
  freeTextFilterValue?: string
  typesFilterValue?: Array<string>
}

interface CustomFieldPanelDetails {
  id: string
}

export type CustomFieldSlice = {
  mainCustomFieldList?: CustomFieldPanelList
  secondaryCustomFieldList?: CustomFieldPanelList
  mainCustomFieldDetails?: CustomFieldPanelDetails
  secondaryCustomFieldDetails?: CustomFieldPanelDetails
}

export const initialState: CustomFieldSlice = {}

const customFieldsSlice = createSlice({
  name: "customFields",
  initialState,
  reducers: {
    mainPanelCustomFieldDetailsUpdated(state, action: PayloadAction<string>) {
      const customFieldID = action.payload
      state.mainCustomFieldDetails = {id: customFieldID}
    },
    secondaryPanelCustomFieldDetailsUpdated(
      state,
      action: PayloadAction<string | undefined>
    ) {
      const customFieldID = action.payload
      if (customFieldID) {
        state.secondaryCustomFieldDetails = {id: customFieldID}
      } else {
        state.secondaryCustomFieldDetails = undefined
      }
    },
    selectionSet: (
      state,
      action: PayloadAction<{ids: string[]; mode: PanelMode}>
    ) => {
      const {mode, ids} = action.payload
      const listKey =
        mode === "main" ? "mainCustomFieldList" : "secondaryCustomFieldList"

      const existingList = state[listKey]

      state[listKey] = {
        ...existingList,
        selectedIDs: ids
      }
    },
    clearSelection: (state, action: PayloadAction<{mode: PanelMode}>) => {
      const {mode} = action.payload
      const listKey =
        mode === "main" ? "mainCustomFieldList" : "secondaryCustomFieldList"

      const existingList = state[listKey]

      state[listKey] = {
        ...existingList,
        selectedIDs: []
      }
    },
    customFieldsTableFiltersUpdated(
      state,
      action: PayloadAction<{
        mode: PanelMode
        freeTextFilterValue?: string
        typesFilterValue?: string[]
      }>
    ) {
      const {mode, freeTextFilterValue, typesFilterValue} = action.payload
      if (mode == "main") {
        state.mainCustomFieldList = {
          ...state.mainCustomFieldList,
          freeTextFilterValue,
          typesFilterValue
        }
        return
      }

      state.secondaryCustomFieldList = {
        ...state.secondaryCustomFieldList,
        freeTextFilterValue,
        typesFilterValue
      }
    },
    customFieldPaginationUpdated(
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
            ? state.mainCustomFieldList?.pageSize
            : state.secondaryCustomFieldList?.pageSize,
        pageNumber:
          mode == "main"
            ? state.mainCustomFieldList?.pageSize
            : state.secondaryCustomFieldList?.pageSize
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
        state.mainCustomFieldList = {
          ...state.mainCustomFieldList,
          ...newValue
        }
        return
      }

      state.secondaryCustomFieldList = {
        ...state.secondaryCustomFieldList,
        ...newValue
      }
    },
    customFieldPageNumberValueUpdated(
      state,
      action: PayloadAction<{mode: PanelMode; value: number}>
    ) {
      const {mode, value} = action.payload
      if (mode == "main") {
        state.mainCustomFieldList = {
          ...state.mainCustomFieldList,
          pageNumber: value
        }
        return
      }

      state.secondaryCustomFieldList = {
        ...state.secondaryCustomFieldList,
        pageNumber: value
      }
    },
    customFieldListSortingUpdated(
      state,
      action: PayloadAction<{mode: PanelMode; value: SortState}>
    ) {
      const {mode, value} = action.payload
      if (mode == "main") {
        state.mainCustomFieldList = {
          ...state.mainCustomFieldList,
          sorting: value
        }
        return
      }

      state.secondaryCustomFieldList = {
        ...state.secondaryCustomFieldList,
        sorting: value
      }
    },
    customFieldListVisibleColumnsUpdated(
      state,
      action: PayloadAction<{mode: PanelMode; value: Array<string>}>
    ) {
      const {mode, value} = action.payload
      if (mode == "main") {
        state.mainCustomFieldList = {
          ...state.mainCustomFieldList,
          visibleColumns: value
        }
        return
      }

      state.secondaryCustomFieldList = {
        ...state.secondaryCustomFieldList,
        visibleColumns: value
      }
    }
  }
})

export const {
  mainPanelCustomFieldDetailsUpdated,
  secondaryPanelCustomFieldDetailsUpdated,
  customFieldPageNumberValueUpdated,
  customFieldPaginationUpdated,
  selectionSet,
  clearSelection,
  customFieldListSortingUpdated,
  customFieldListVisibleColumnsUpdated,
  customFieldsTableFiltersUpdated
} = customFieldsSlice.actions
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

export const selectSelectedIDs = (state: RootState, mode: PanelMode) => {
  if (mode == "main") {
    return state.customFields.mainCustomFieldList?.selectedIDs
  }

  return state.customFields.secondaryCustomFieldList?.selectedIDs
}

export const selectPageSize = (state: RootState, mode: PanelMode): number => {
  if (mode == "main") {
    return (
      state.customFields.mainCustomFieldList?.pageSize ||
      PAGINATION_DEFAULT_ITEMS_PER_PAGES
    )
  }

  return (
    state.customFields.secondaryCustomFieldList?.pageSize ||
    PAGINATION_DEFAULT_ITEMS_PER_PAGES
  )
}

export const selectCustomFieldPageSize = (
  state: RootState,
  mode: PanelMode
) => {
  if (mode == "main") {
    return state.customFields.mainCustomFieldList?.pageSize
  }

  return state.customFields.secondaryCustomFieldList?.pageSize
}

export const selectCustomFieldPageNumber = (
  state: RootState,
  mode: PanelMode
) => {
  if (mode == "main") {
    return state.customFields.mainCustomFieldList?.pageNumber
  }

  return state.customFields.secondaryCustomFieldList?.pageNumber
}
export const selectCustomFieldSorting = (state: RootState, mode: PanelMode) => {
  if (mode == "main") {
    return state.customFields.mainCustomFieldList?.sorting
  }

  return state.customFields.secondaryCustomFieldList?.sorting
}

export const selectCustomFieldDetailsID = (
  state: RootState,
  mode: PanelMode
) => {
  if (mode == "main") {
    return state.customFields.mainCustomFieldDetails?.id
  }

  return state.customFields.secondaryCustomFieldDetails?.id
}

export const selectCustomFieldVisibleColumns = (
  state: RootState,
  mode: PanelMode
) => {
  if (mode == "main") {
    return state.customFields.mainCustomFieldList?.visibleColumns
  }

  return state.customFields.secondaryCustomFieldList?.visibleColumns
}

export const selectCustomFieldFreeTextFilterValue = (
  state: RootState,
  mode: PanelMode
) => {
  if (mode == "main") {
    return state.customFields.mainCustomFieldList?.freeTextFilterValue
  }

  return state.customFields.secondaryCustomFieldList?.freeTextFilterValue
}

export const selectCustomFieldTypesFilterValue = (
  state: RootState,
  mode: PanelMode
) => {
  if (mode == "main") {
    return state.customFields.mainCustomFieldList?.typesFilterValue
  }

  return state.customFields.secondaryCustomFieldList?.typesFilterValue
}

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
