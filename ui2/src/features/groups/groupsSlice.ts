import {createSlice, createSelector, PayloadAction} from "@reduxjs/toolkit"

import {RootState} from "@/app/types"
import type {Group, Paginated, PaginationType} from "@/types"
import {PAGINATION_DEFAULT_ITEMS_PER_PAGES} from "@/cconstants"
import {apiSliceWithGroups} from "./apiSlice"

export type GroupSlice = {
  selectedIds: Array<string>
  pagination: PaginationType | null
  lastPageSize: number
}

export const initialState: GroupSlice = {
  selectedIds: [],
  pagination: null,
  lastPageSize: PAGINATION_DEFAULT_ITEMS_PER_PAGES
}

const groupsSlice = createSlice({
  name: "groups",
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
      apiSliceWithGroups.endpoints.getPaginatedGroups.matchFulfilled,
      (state, action) => {
        const payload: Paginated<Group> = action.payload
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

export const selectGroupsResult =
  apiSliceWithGroups.endpoints.getGroups.select()
export const selectItemIds = (_: RootState, itemIds: string[]) => itemIds
export const selectItemId = (_: RootState, itemId: string) => itemId

export const selectGroupsById = createSelector(
  [selectGroupsResult, selectItemIds],
  (groupsData, groupIds) => {
    return groupsData.data?.filter(g => groupIds.includes(g.id))
  }
)

export const selectGroupById = createSelector(
  [selectGroupsResult, selectItemId],
  (groupsData, groupId) => {
    return groupsData.data?.find(g => groupId == g.id)
  }
)

export const selectSelectedIds = (state: RootState) => state.groups.selectedIds

export const selectPagination = (state: RootState): PaginationType | null => {
  return state.groups.pagination
}

export const selectLastPageSize = (state: RootState): number => {
  return state.groups.lastPageSize
}
