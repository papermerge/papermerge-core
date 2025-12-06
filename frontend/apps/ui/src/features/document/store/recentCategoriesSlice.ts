import {RootState} from "@/app/types"
import {createSelector, createSlice, PayloadAction} from "@reduxjs/toolkit"

/**
 * Maximum number of recently used categories to store
 */
const MAX_RECENT_CATEGORIES = 5

export interface RecentCategory {
  id: string
  name: string
  usedAt: number // timestamp for sorting
}

export interface RecentCategoriesState {
  categories: RecentCategory[]
}

export const initialState: RecentCategoriesState = {
  categories: []
}

const recentCategoriesSlice = createSlice({
  name: "recentCategories",
  initialState,
  reducers: {
    /**
     * Add a category to recently used list.
     * If the category already exists, update its timestamp.
     * Maintains maximum of MAX_RECENT_CATEGORIES items.
     */
    addRecentCategory: (
      state,
      action: PayloadAction<{id: string; name: string}>
    ) => {
      const {id, name} = action.payload
      const now = Date.now()

      // Remove if already exists (we'll re-add with new timestamp)
      const existingIndex = state.categories.findIndex(cat => cat.id === id)
      if (existingIndex !== -1) {
        state.categories.splice(existingIndex, 1)
      }

      // Add to the beginning (most recent)
      state.categories.unshift({id, name, usedAt: now})

      // Trim to max size
      if (state.categories.length > MAX_RECENT_CATEGORIES) {
        state.categories = state.categories.slice(0, MAX_RECENT_CATEGORIES)
      }
    },

    /**
     * Remove a specific category from recently used list
     * (useful if category is deleted)
     */
    removeRecentCategory: (state, action: PayloadAction<string>) => {
      state.categories = state.categories.filter(
        cat => cat.id !== action.payload
      )
    },

    /**
     * Clear all recently used categories
     */
    clearRecentCategories: state => {
      state.categories = []
    }
  }
})

export const {addRecentCategory, removeRecentCategory, clearRecentCategories} =
  recentCategoriesSlice.actions

export default recentCategoriesSlice.reducer

// Selectors
export const selectRecentCategories = (state: RootState): RecentCategory[] =>
  state.recentCategories.categories

/**
 * Select recent categories sorted by most recently used (most recent first)
 */
export const selectRecentCategoriesSorted = createSelector(
  [selectRecentCategories],
  categories => [...categories].sort((a, b) => b.usedAt - a.usedAt)
)

/**
 * Select recent category IDs (for quick lookup)
 */
export const selectRecentCategoryIds = createSelector(
  [selectRecentCategories],
  categories => categories.map(cat => cat.id)
)
