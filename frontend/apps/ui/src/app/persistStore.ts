import {STORAGE_KEY} from "./constants"
import type {RootState} from "./types"

export function loadPersistedState() {
  try {
    const serialized = localStorage.getItem(STORAGE_KEY)
    if (serialized) {
      return JSON.parse(serialized)
    }
  } catch (e) {
    console.warn("Failed to load persisted state:", e)
  }
  return undefined
}

// Select what to persist
export function selectStateToPersist(state: RootState) {
  return {
    panelRegistry: state.panelRegistry
  }
}
