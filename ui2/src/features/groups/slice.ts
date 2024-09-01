import {createSlice, createEntityAdapter, PayloadAction} from "@reduxjs/toolkit"

import {RootState} from "@/app/types"
import type {Group, Paginated, PaginationType} from "@/types"
import {PAGINATION_DEFAULT_ITEMS_PER_PAGES} from "@/cconstants"
import {apiSlice} from "../api/slice"

export type ExtraStateType = {
  selectedIds: Array<string>
  pagination: PaginationType | null
  lastPageSize: number
}

export const extraState: ExtraStateType = {
  selectedIds: [],
  pagination: null,
  lastPageSize: PAGINATION_DEFAULT_ITEMS_PER_PAGES
}

const groupsAdapter = createEntityAdapter({
  selectId: (group: Group) => group.id,
  sortComparer: (g1, g2) => g1.name.localeCompare(g2.name)
})

const initialState = groupsAdapter.getInitialState(extraState)

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
      apiSlice.endpoints.getGroups.matchFulfilled,
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

export const {selectAll: selectAllGroups} =
  groupsAdapter.getSelectors<RootState>(state => state.groups)

export const selectSelectedIds = (state: RootState) => state.groups.selectedIds
export const selectGroupById = (state: RootState, groupId?: string) => {
  if (groupId) {
    return state.groups.entities[groupId]
  }

  return null
}
export const selectGroupsByIds = (state: RootState, groupIds: string[]) => {
  return Object.values(state.groups.entities).filter((g: Group) =>
    groupIds.includes(g.id)
  )
}

export const selectPagination = (state: RootState): PaginationType | null => {
  return state.groups.pagination
}

export const selectLastPageSize = (state: RootState): number => {
  return state.groups.lastPageSize
}
