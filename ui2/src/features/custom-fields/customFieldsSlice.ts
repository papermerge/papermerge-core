import {PayloadAction, createSelector, createSlice} from "@reduxjs/toolkit"

import {RootState} from "@/app/types"
import {PAGINATION_DEFAULT_ITEMS_PER_PAGES} from "@/cconstants"
import type {CustomField, Paginated, PaginationType} from "@/types"
import {apiSliceWithCustomFields} from "./apiSlice"

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

const groupsSlice = createSlice({
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
  lastPageSizeUpdate
} = groupsSlice.actions
export default groupsSlice.reducer

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
