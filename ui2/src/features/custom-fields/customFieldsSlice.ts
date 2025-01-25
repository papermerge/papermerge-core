import {AppStartListening} from "@/app/listenerMiddleware"
import {notifications} from "@mantine/notifications"
import {PayloadAction, createSelector, createSlice} from "@reduxjs/toolkit"

import {RootState} from "@/app/types"
import {PAGINATION_DEFAULT_ITEMS_PER_PAGES} from "@/cconstants"
import type {
  CustomField,
  Paginated,
  PaginationType,
  ServerErrorType
} from "@/types"
import {apiSliceWithCustomFields} from "./apiSlice"

import type {CustomFieldListColumnName, CustomFieldSortByInput} from "./types"

export type CustomFieldSlice = {
  selectedIds: Array<string>
  pagination: PaginationType | null
  lastPageSize: number
  listTableSort: {
    sortBy: CustomFieldSortByInput
    filter?: string
  }
}

export const initialState: CustomFieldSlice = {
  selectedIds: [],
  pagination: null,
  lastPageSize: PAGINATION_DEFAULT_ITEMS_PER_PAGES,
  listTableSort: {
    sortBy: "name"
  }
}

const customFieldsSlice = createSlice({
  name: "customFields",
  initialState,
  reducers: {
    selectionAdd: (state, action: PayloadAction<string>) => {
      state.selectedIds.push(action.payload)
    },
    selectionAddMany: (state, action: PayloadAction<Array<string>>) => {
      state.selectedIds = action.payload
    },
    selectionRemove: (state, action: PayloadAction<string>) => {
      const newSelectedIds = state.selectedIds.filter(i => i != action.payload)
      state.selectedIds = newSelectedIds
    },
    clearSelection: state => {
      state.selectedIds = []
    },
    lastPageSizeUpdate: (state, action: PayloadAction<number>) => {
      state.lastPageSize = action.payload
    },
    sortByUpdated: (
      state,
      action: PayloadAction<CustomFieldListColumnName>
    ) => {
      const columnName = action.payload
      if (columnName == "name" && state.listTableSort.sortBy == "name") {
        state.listTableSort.sortBy = "-name"
      } else if (
        columnName == "name" &&
        state.listTableSort.sortBy == "-name"
      ) {
        state.listTableSort.sortBy = "name"
      } else if (columnName == "type" && state.listTableSort.sortBy == "type") {
        state.listTableSort.sortBy = "-type"
      } else if (
        columnName == "type" &&
        state.listTableSort.sortBy == "-type"
      ) {
        state.listTableSort.sortBy = "type"
      } else {
        state.listTableSort.sortBy = columnName
      }
    },
    filterUpdated: (state, action: PayloadAction<string | undefined>) => {
      state.listTableSort.filter = action.payload
    }
  },
  extraReducers(builder) {
    builder.addMatcher(
      apiSliceWithCustomFields.endpoints.getPaginatedCustomFields
        .matchFulfilled,
      (state, action) => {
        const payload: Paginated<CustomField> = action.payload
        state.pagination = {
          pageNumber: payload.page_number,
          pageSize: payload.page_size,
          numPages: payload.num_pages
        }
        state.lastPageSize = payload.page_size
      }
    )
  }
})

export const {
  selectionAdd,
  selectionAddMany,
  selectionRemove,
  clearSelection,
  lastPageSizeUpdate,
  sortByUpdated,
  filterUpdated
} = customFieldsSlice.actions
export default customFieldsSlice.reducer

export const selectCustomFieldsResult =
  apiSliceWithCustomFields.endpoints.getCustomFields.select()
export const selectItemIds = (_: RootState, itemIds: string[]) => itemIds
export const selectItemId = (_: RootState, itemId: string) => itemId

export const selectGroupsById = createSelector(
  [selectCustomFieldsResult, selectItemIds],
  (customFieldsData, customFieldsIds) => {
    return customFieldsData.data?.filter(cf => customFieldsIds.includes(cf.id))
  }
)

export const selectGroupById = createSelector(
  [selectCustomFieldsResult, selectItemId],
  (customFieldsData, customFieldId) => {
    return customFieldsData.data?.find(cf => customFieldId == cf.id)
  }
)

export const selectSelectedIds = (state: RootState) =>
  state.customFields.selectedIds

export const selectPagination = (state: RootState): PaginationType | null => {
  return state.customFields.pagination
}

export const selectLastPageSize = (state: RootState): number => {
  return state.customFields.lastPageSize
}

export const selectTableSortColumns = (state: RootState) =>
  state.customFields.listTableSort

export const selectSortedByName = (state: RootState) => {
  if (state.customFields.listTableSort.sortBy == "name") {
    return true
  }
  if (state.customFields.listTableSort.sortBy == "-name") {
    return true
  }

  return false
}

export const selectReverseSortedByName = (state: RootState) => {
  if (state.customFields.listTableSort.sortBy == "-name") {
    return true
  }

  return false
}

export const selectSortedByType = (state: RootState) => {
  if (state.customFields.listTableSort.sortBy == "type") {
    return true
  }
  if (state.customFields.listTableSort.sortBy == "-type") {
    return true
  }

  return false
}

export const selectReverseSortedByType = (state: RootState) => {
  if (state.customFields.listTableSort.sortBy == "-type") {
    return true
  }

  return false
}

export const selectFilterText = (state: RootState) => {
  return state.customFields.listTableSort.filter
}

export const customFieldCRUDListeners = (
  startAppListening: AppStartListening
) => {
  // Create positive
  startAppListening({
    matcher:
      apiSliceWithCustomFields.endpoints.addNewCustomField.matchFulfilled,
    effect: async () => {
      notifications.show({
        withBorder: true,
        message: "Custom Field successfully created"
      })
    }
  })
  // Create negative
  startAppListening({
    matcher: apiSliceWithCustomFields.endpoints.addNewCustomField.matchRejected,
    effect: async action => {
      const error = action.payload as ServerErrorType
      notifications.show({
        autoClose: false,
        withBorder: true,
        color: "red",
        title: "Error",
        message: error.data.detail
      })
    }
  })
  // Update positive
  startAppListening({
    matcher: apiSliceWithCustomFields.endpoints.editCustomField.matchFulfilled,
    effect: async () => {
      notifications.show({
        withBorder: true,
        message: "Custom Field successfully updated"
      })
    }
  })
  // Update negative
  startAppListening({
    matcher: apiSliceWithCustomFields.endpoints.editCustomField.matchRejected,
    effect: async action => {
      const error = action.payload as ServerErrorType
      notifications.show({
        autoClose: false,
        withBorder: true,
        color: "red",
        title: "Error",
        message: error.data.detail
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
        message: "Custom Field successfully deleted"
      })
    }
  })
  // Delete negative
  startAppListening({
    matcher: apiSliceWithCustomFields.endpoints.deleteCustomField.matchRejected,
    effect: async action => {
      const error = action.payload as ServerErrorType
      notifications.show({
        autoClose: false,
        withBorder: true,
        color: "red",
        title: "Error",
        message: error.data.detail
      })
    }
  })
}
