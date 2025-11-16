import type {Filter} from "@/features/search/microcomp/types"
import {createSlice, PayloadAction} from "@reduxjs/toolkit"

export interface SavedSearch {
  id: string
  name: string
  filters: Filter[]
  createdAt: string
  updatedAt: string
}

export interface SearchState {
  // Current active search
  filters: Filter[]

  // Saved searches (future feature)
  savedSearches: SavedSearch[]
  activeSearchId: string | null
}

export const initialState: SearchState = {
  filters: [],
  savedSearches: [],
  activeSearchId: null
}

const searchSlice = createSlice({
  name: "search",
  initialState,
  reducers: {
    addFilter: (state, action: PayloadAction<Filter>) => {
      state.filters.push(action.payload)
    },

    updateFilter: (
      state,
      action: PayloadAction<{index: number; updates: Partial<Filter>}>
    ) => {
      const {index, updates} = action.payload
      if (state.filters[index]) {
        state.filters[index] = {...state.filters[index], ...updates} as Filter
      }
    },

    removeFilter: (state, action: PayloadAction<number>) => {
      state.filters.splice(action.payload, 1)
    },

    clearFilters: state => {
      state.filters = []
    },

    setFilters: (state, action: PayloadAction<Filter[]>) => {
      state.filters = action.payload
    }
  }
})

export const {addFilter, updateFilter, removeFilter, clearFilters, setFilters} =
  searchSlice.actions

export default searchSlice.reducer
