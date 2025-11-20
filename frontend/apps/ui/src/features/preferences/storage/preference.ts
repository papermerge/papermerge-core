import {RootState} from "@/app/types"
import type {Preferences} from "@/features/preferences/types"
import {fetchCurrentUser} from "@/slices/currentUser"
import {createSlice, PayloadAction} from "@reduxjs/toolkit"

export interface PreferencesState {
  me: Preferences
  system: Preferences
}

const defaultPreferences: Preferences = {
  date_format: "YYYY-MM-DD",
  timestamp_format: "DD.MM.YYYY HH:mm:ss",
  number_format: "eu_dot",
  timezone: "UTC",
  ui_language: "en",
  ui_theme: "light",
  uploaded_document_lang: "eng",
  search_lang: "eng"
}

export const initialState: PreferencesState = {
  me: defaultPreferences,
  system: defaultPreferences
}

const preferencesSlice = createSlice({
  name: "preferences",
  initialState,
  reducers: {
    // Action to update user preferences locally (optimistic update)
    updateMyPreferences: (
      state,
      action: PayloadAction<Partial<Preferences>>
    ) => {
      state.me = {...state.me, ...action.payload}
    },
    // Action to set system preferences (from API or config)
    setSystemPreferences: (state, action: PayloadAction<Preferences>) => {
      state.system = action.payload
    }
  },
  extraReducers: builder => {
    // Listen to fetchCurrentUser.fulfilled to extract preferences
    builder.addCase(fetchCurrentUser.fulfilled, (state, action) => {
      if (action.payload.preferences) {
        state.me = action.payload.preferences
      }
    })
  }
})

export const {updateMyPreferences, setSystemPreferences} =
  preferencesSlice.actions

export default preferencesSlice.reducer

// Selectors
export const selectMyPreferences = (state: RootState): Preferences =>
  state.preferences.me

export const selectSystemPreferences = (state: RootState): Preferences =>
  state.preferences.system

export const selectPreferences = (state: RootState): PreferencesState =>
  state.preferences
