import {RootState} from "@/app/types"
import {createSelector, createSlice, PayloadAction} from "@reduxjs/toolkit"

/**
 * Maximum number of recently used languages to store
 */
const MAX_RECENT_LANGS = 5

export interface RecentLanguage {
  value: string
  label: string
  usedAt: number // timestamp for sorting
}

export interface RecentLanguagesState {
  languages: RecentLanguage[]
}

export const initialState: RecentLanguagesState = {
  languages: []
}

const recentLanguagesSlice = createSlice({
  name: "recentDocumentLanguages",
  initialState,
  reducers: {
    /**
     * Add a category to recently used list.
     * If the category already exists, update its timestamp.
     * Maintains maximum of MAX_RECENT_CATEGORIES items.
     */
    addRecentLanguage: (
      state,
      action: PayloadAction<{value: string; label: string}>
    ) => {
      const {value, label} = action.payload
      const now = Date.now()

      // Remove if already exists (we'll re-add with new timestamp)
      const existingIndex = state.languages.findIndex(
        lang => lang.value === value
      )
      if (existingIndex !== -1) {
        state.languages.splice(existingIndex, 1)
      }

      // Add to the beginning (most recent)
      state.languages.unshift({value, label, usedAt: now})

      // Trim to max size
      if (state.languages.length > MAX_RECENT_LANGS) {
        state.languages = state.languages.slice(0, MAX_RECENT_LANGS)
      }
    },

    /**
     * Remove a specific lang from recently used list
     * (useful if lang is deleted)
     */
    removeRecentLanguage: (state, action: PayloadAction<string>) => {
      state.languages = state.languages.filter(
        lang => lang.value !== action.payload
      )
    },

    /**
     * Clear all recently used languages
     */
    clearRecentLanguages: state => {
      state.languages = []
    }
  }
})

export const {addRecentLanguage, removeRecentLanguage, clearRecentLanguages} =
  recentLanguagesSlice.actions

export default recentLanguagesSlice.reducer

// Selectors
export const selectRecentLanguages = (state: RootState): RecentLanguage[] =>
  state.recentDocumentLanguages.languages

/**
 * Select recent languages sorted by most recently used (most recent first)
 */
export const selectRecentLanguagesSorted = createSelector(
  [selectRecentLanguages],
  languages => [...languages].sort((a, b) => b.usedAt - a.usedAt)
)

export const selectRecentLanguageValues = createSelector(
  [selectRecentLanguages],
  languages => languages.map(lang => lang.value)
)
