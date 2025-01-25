import {AppStartListening} from "@/app/listenerMiddleware"
import {notifications} from "@mantine/notifications"
import {PayloadAction, createSelector, createSlice} from "@reduxjs/toolkit"

import {RootState} from "@/app/types"
import {PAGINATION_DEFAULT_ITEMS_PER_PAGES} from "@/cconstants"
import type {Paginated, PaginationType, ServerErrorType} from "@/types"

import {apiSliceWithDocTypes} from "./apiSlice"
import type {
  DocType,
  DocumentTypeListColumnName,
  DocumentTypeSortByInput
} from "./types"

export type CustomFieldSlice = {
  selectedIds: Array<string>
  pagination: PaginationType | null
  lastPageSize: number
  listTableSort: {
    sortBy: DocumentTypeSortByInput
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

const documentTypesSlice = createSlice({
  name: "documentType",
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
      action: PayloadAction<DocumentTypeListColumnName>
    ) => {
      const columnName = action.payload
      if (columnName == "name" && state.listTableSort.sortBy == "name") {
        state.listTableSort.sortBy = "-name"
      } else if (
        columnName == "name" &&
        state.listTableSort.sortBy == "-name"
      ) {
        state.listTableSort.sortBy = "name"
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
      apiSliceWithDocTypes.endpoints.getPaginatedDocumentTypes.matchFulfilled,
      (state, action) => {
        const payload: Paginated<DocType> = action.payload
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
} = documentTypesSlice.actions
export default documentTypesSlice.reducer

export const selectDocumentTypesResult =
  apiSliceWithDocTypes.endpoints.getDocumentTypes.select()
export const selectItemIds = (_: RootState, itemIds: string[]) => itemIds
export const selectItemId = (_: RootState, itemId: string) => itemId

export const selectGroupsById = createSelector(
  [selectDocumentTypesResult, selectItemIds],
  (documentTypesData, documentTypesIds) => {
    return documentTypesData.data?.filter(dt =>
      documentTypesIds.includes(dt.id)
    )
  }
)

export const selectGroupById = createSelector(
  [selectDocumentTypesResult, selectItemId],
  (documentTypesData, documentTypeId) => {
    return documentTypesData.data?.find(dt => documentTypeId == dt.id)
  }
)

export const selectSelectedIds = (state: RootState) =>
  state.documentTypes.selectedIds

export const selectPagination = (state: RootState): PaginationType | null => {
  return state.documentTypes.pagination
}

export const selectLastPageSize = (state: RootState): number => {
  return state.documentTypes.lastPageSize
}

export const selectSortedByName = (state: RootState) => {
  if (state.documentTypes.listTableSort.sortBy == "name") {
    return true
  }
  if (state.documentTypes.listTableSort.sortBy == "-name") {
    return true
  }

  return false
}

export const selectReverseSortedByName = (state: RootState) => {
  if (state.documentTypes.listTableSort.sortBy == "-name") {
    return true
  }

  return false
}

export const selectTableSortColumns = (state: RootState) =>
  state.documentTypes.listTableSort

export const selectFilterText = (state: RootState) => {
  return state.customFields.listTableSort.filter
}

export const documentTypeCRUDListeners = (
  startAppListening: AppStartListening
) => {
  // Create positive
  startAppListening({
    matcher: apiSliceWithDocTypes.endpoints.addDocumentType.matchFulfilled,
    effect: async () => {
      notifications.show({
        withBorder: true,
        message: "Document Type successfully created"
      })
    }
  })
  // Create negative
  startAppListening({
    matcher: apiSliceWithDocTypes.endpoints.addDocumentType.matchRejected,
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
    matcher: apiSliceWithDocTypes.endpoints.editDocumentType.matchFulfilled,
    effect: async () => {
      notifications.show({
        withBorder: true,
        message: "Document Type successfully updated"
      })
    }
  })
  // Update negative
  startAppListening({
    matcher: apiSliceWithDocTypes.endpoints.editDocumentType.matchRejected,
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
    matcher: apiSliceWithDocTypes.endpoints.deleteDocumentType.matchFulfilled,
    effect: async () => {
      notifications.show({
        withBorder: true,
        message: "Document Type successfully deleted"
      })
    }
  })
  // Delete negative
  startAppListening({
    matcher: apiSliceWithDocTypes.endpoints.deleteDocumentType.matchRejected,
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
