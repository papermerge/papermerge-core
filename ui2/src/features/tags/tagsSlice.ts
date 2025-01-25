import {PayloadAction, createSelector, createSlice} from "@reduxjs/toolkit"

import {RootState} from "@/app/types"
import {PAGINATION_DEFAULT_ITEMS_PER_PAGES} from "@/cconstants"
import type {PaginationType} from "@/types"
import {apiSliceWithTags} from "./apiSlice"
import type {TagsListColumnName, TagsSortByInput} from "./types"

export type TagSlice = {
  selectedIds: Array<string>
  pagination: PaginationType | null
  lastPageSize: number
  listTableSort: {
    sortBy: TagsSortByInput
    filter?: string
  }
}

const initialState: TagSlice = {
  selectedIds: [],
  pagination: null,
  lastPageSize: PAGINATION_DEFAULT_ITEMS_PER_PAGES,
  listTableSort: {
    sortBy: "name"
  }
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
    },
    sortByUpdated: (state, action: PayloadAction<TagsListColumnName>) => {
      const columnName = action.payload
      if (columnName == "name" && state.listTableSort.sortBy == "name") {
        state.listTableSort.sortBy = "-name"
      } else if (
        columnName == "name" &&
        state.listTableSort.sortBy == "-name"
      ) {
        state.listTableSort.sortBy = "name"
      }
      //
      else if (
        columnName == "pinned" &&
        state.listTableSort.sortBy == "pinned"
      ) {
        state.listTableSort.sortBy = "-pinned"
      } else if (
        columnName == "pinned" &&
        state.listTableSort.sortBy == "-pinned"
      ) {
        state.listTableSort.sortBy = "pinned"
      }
      //
      else if (
        columnName == "description" &&
        state.listTableSort.sortBy == "description"
      ) {
        state.listTableSort.sortBy = "-description"
      } else if (
        columnName == "description" &&
        state.listTableSort.sortBy == "-description"
      ) {
        state.listTableSort.sortBy = "description"
      } else if (columnName == "ID" && state.listTableSort.sortBy == "ID") {
        state.listTableSort.sortBy = "-ID"
      } else if (columnName == "ID" && state.listTableSort.sortBy == "-ID") {
        state.listTableSort.sortBy = "ID"
      }
      //
      else {
        state.listTableSort.sortBy = columnName
      }
    },
    filterUpdated: (state, action: PayloadAction<string | undefined>) => {
      state.listTableSort.filter = action.payload
    }
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

export const selectTableSortColumns = (state: RootState) =>
  state.tags.listTableSort

export const selectSortedByName = (state: RootState) => {
  if (state.tags.listTableSort.sortBy == "name") {
    return true
  }
  if (state.tags.listTableSort.sortBy == "-name") {
    return true
  }

  return false
}

export const selectReverseSortedByName = (state: RootState) => {
  if (state.tags.listTableSort.sortBy == "-name") {
    return true
  }

  return false
}

export const selectSortedByPinned = (state: RootState) => {
  if (state.tags.listTableSort.sortBy == "pinned") {
    return true
  }
  if (state.tags.listTableSort.sortBy == "-pinned") {
    return true
  }

  return false
}

export const selectReverseSortedByPinned = (state: RootState) => {
  if (state.tags.listTableSort.sortBy == "-pinned") {
    return true
  }

  return false
}

export const selectSortedByDescription = (state: RootState) => {
  if (state.tags.listTableSort.sortBy == "description") {
    return true
  }
  if (state.tags.listTableSort.sortBy == "-description") {
    return true
  }

  return false
}

export const selectReverseSortedByDescription = (state: RootState) => {
  if (state.tags.listTableSort.sortBy == "-description") {
    return true
  }

  return false
}

export const selectSortedByID = (state: RootState) => {
  if (state.tags.listTableSort.sortBy == "ID") {
    return true
  }
  if (state.tags.listTableSort.sortBy == "-ID") {
    return true
  }

  return false
}

export const selectReverseSortedByID = (state: RootState) => {
  if (state.tags.listTableSort.sortBy == "-ID") {
    return true
  }

  return false
}

export const selectFilterText = (state: RootState) => {
  return state.tags.listTableSort.filter
}
