import {PayloadAction, createSelector, createSlice} from "@reduxjs/toolkit"

import {RootState} from "@/app/types"
import {PAGINATION_DEFAULT_ITEMS_PER_PAGES} from "@/cconstants"
import type {DocType, Paginated, PaginationType} from "@/types"
import {apiSliceWithDocTypes} from "./apiSlice"

export type CustomFieldSlice = {
  selectedIds: Array<string>
  pagination: PaginationType | null
  lastPageSize: number
}

export const initialState: CustomFieldSlice = {
  selectedIds: [],
  pagination: null,
  lastPageSize: PAGINATION_DEFAULT_ITEMS_PER_PAGES
}

const documentTypesSlice = createSlice({
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
  lastPageSizeUpdate
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
