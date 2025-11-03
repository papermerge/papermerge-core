import type {Token} from "@/features/search/microcomp/types"
import {createSlice, PayloadAction} from "@reduxjs/toolkit"

export interface SavedSearch {
  id: string
  name: string
  tokens: Token[]
  createdAt: string
  updatedAt: string
}

export interface SearchState {
  // Current active search
  tokens: Token[]

  // Saved searches (future feature)
  savedSearches: SavedSearch[]
  activeSearchId: string | null
}

export const initialState: SearchState = {
  tokens: [],
  savedSearches: [],
  activeSearchId: null
}

const searchSlice = createSlice({
  name: "search",
  initialState,
  reducers: {
    addToken: (state, action: PayloadAction<Token>) => {
      state.tokens.push(action.payload)
    },

    updateToken: (
      state,
      action: PayloadAction<{index: number; updates: Partial<Token>}>
    ) => {
      const {index, updates} = action.payload
      if (state.tokens[index]) {
        state.tokens[index] = {...state.tokens[index], ...updates} as Token
      }
    },

    removeToken: (state, action: PayloadAction<number>) => {
      state.tokens.splice(action.payload, 1)
    },

    clearTokens: state => {
      state.tokens = []
    },

    setTokens: (state, action: PayloadAction<Token[]>) => {
      state.tokens = action.payload
    }
  }
})

export const {addToken, updateToken, removeToken, clearTokens, setTokens} =
  searchSlice.actions

export default searchSlice.reducer
