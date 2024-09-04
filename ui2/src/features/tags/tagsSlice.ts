import {createSlice, PayloadAction, createSelector} from "@reduxjs/toolkit"

import {RootState} from "@/app/types"
import type {PaginationType} from "@/types"
import {PAGINATION_DEFAULT_ITEMS_PER_PAGES} from "@/cconstants"
import {apiSliceWithTags} from "./apiSlice"

export type TagSlice = {
  selectedIds: Array<string>
  pagination: PaginationType | null
  lastPageSize: number
}

const initialState: TagSlice = {
  selectedIds: [],
  pagination: null,
  lastPageSize: PAGINATION_DEFAULT_ITEMS_PER_PAGES
}
const tagsSlice = createSlice({
  name: "tags",
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
  }
})

export const {
  selectionAdd,
  selectionAddMany,
  selectionRemove,
  clearSelection,
  lastPageSizeUpdate
} = tagsSlice.actions
export default tagsSlice.reducer

export const selectTagsResult = apiSliceWithTags.endpoints.getTags.select()
export const selectItems = (_: RootState, items: string[]) => items

export const selectTagsByName = createSelector(
  [selectTagsResult, selectItems],
  (tagsData, tagNames) => {
    return tagsData.data?.filter(t => tagNames.includes(t.name)) || []
  }
)

export const selectSelectedIds = (state: RootState) => state.tags.selectedIds

// @ts-ignore
export const selectItemNames = (state: RootState, names: string[]) => names
// @ts-ignore
export const selectItemIds = (state: RootState, itemIds: string[]) => itemIds

export const selectLastPageSize = (state: RootState): number => {
  return state.tags.lastPageSize
}
