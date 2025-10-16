// features/ui/panelRegistry.ts
import type {PanelComponent} from "@/types.d/ui"
import {createSlice, PayloadAction} from "@reduxjs/toolkit"
import type {SortState} from "kommon"

export interface PanelListState {
  pageNumber?: number
  pageSize?: number
  sorting?: SortState
  visibleColumns?: string[]
  selectedIDs?: string[]
  filters?: Record<string, any>
}

export interface PanelDetailsState {
  entityId: string
}

export interface PanelState {
  // What component should be rendered in this panel
  component?: PanelComponent
  // What type of view (list, details, etc.)
  type: "list" | "details" | "viewer" | "commander" | "search"
  // List-specific state
  list?: PanelListState
  // Details-specific state
  details?: PanelDetailsState
  // Custom state for special cases
  custom?: Record<string, any>
}

export interface PanelRegistryState {
  panels: {
    [panelId: string]: PanelState
  }
}

const initialState: PanelRegistryState = {
  panels: {
    main: {type: "list", component: undefined},
    secondary: {type: "list", component: undefined}
  }
}

const panelRegistrySlice = createSlice({
  name: "panelRegistry",
  initialState,
  reducers: {
    // Set which component should render in the panel
    setPanelComponent: (
      state,
      action: PayloadAction<{
        panelId: string
        component: PanelComponent | undefined
      }>
    ) => {
      const {panelId, component} = action.payload
      if (!state.panels[panelId]) {
        state.panels[panelId] = {type: "list"}
      }
      state.panels[panelId].component = component
    },

    setPanelList: (
      state,
      action: PayloadAction<{
        panelId: string
        list: Partial<PanelListState>
      }>
    ) => {
      const {panelId, list} = action.payload
      if (!state.panels[panelId]) {
        state.panels[panelId] = {type: "list"}
      }
      state.panels[panelId].type = "list"
      state.panels[panelId].list = {
        ...state.panels[panelId].list,
        ...list
      }
    },

    updatePanelFilters: (
      state,
      action: PayloadAction<{
        panelId: string
        filters: Record<string, any>
      }>
    ) => {
      const {panelId, filters} = action.payload
      if (!state.panels[panelId]?.list) {
        state.panels[panelId] = {type: "list", list: {}}
      }
      state.panels[panelId].list!.filters = {
        ...state.panels[panelId].list!.filters,
        ...filters
      }
    },

    setPanelDetails: (
      state,
      action: PayloadAction<{
        panelId: string
        entityId: string
      }>
    ) => {
      const {panelId, entityId} = action.payload
      state.panels[panelId] = {
        ...state.panels[panelId],
        type: "details",
        details: {entityId}
      }
    },

    setPanelType: (
      state,
      action: PayloadAction<{
        panelId: string
        type: PanelState["type"]
      }>
    ) => {
      const {panelId, type} = action.payload
      if (!state.panels[panelId]) {
        state.panels[panelId] = {type}
      }
      state.panels[panelId].type = type
    },

    setPanelCustomState: (
      state,
      action: PayloadAction<{
        panelId: string
        key: string
        value: any
      }>
    ) => {
      const {panelId, key, value} = action.payload
      if (!state.panels[panelId]) {
        state.panels[panelId] = {type: "list"}
      }
      if (!state.panels[panelId].custom) {
        state.panels[panelId].custom = {}
      }
      state.panels[panelId].custom![key] = value
    },

    clearPanelSelection: (state, action: PayloadAction<{panelId: string}>) => {
      const {panelId} = action.payload
      if (state.panels[panelId]?.list) {
        state.panels[panelId].list!.selectedIDs = []
      }
    },

    resetPanel: (state, action: PayloadAction<{panelId: string}>) => {
      const {panelId} = action.payload
      state.panels[panelId] = {type: "list", list: {}}
    },

    // Close a panel (typically secondary)
    closePanel: (state, action: PayloadAction<{panelId: string}>) => {
      const {panelId} = action.payload
      state.panels[panelId] = {
        type: "list",
        component: undefined,
        list: {}
      }
    }
  }
})

export const {
  setPanelComponent,
  setPanelList,
  updatePanelFilters,
  setPanelDetails,
  setPanelType,
  setPanelCustomState,
  clearPanelSelection,
  resetPanel,
  closePanel
} = panelRegistrySlice.actions

export default panelRegistrySlice.reducer

// ============================================================================
// SELECTORS
// ============================================================================

import type {RootState} from "@/app/types"

export const selectPanel = (state: RootState, panelId: string) =>
  state.panelRegistry.panels[panelId]

export const selectPanelComponent = (state: RootState, panelId: string) =>
  selectPanel(state, panelId)?.component

export const selectPanelList = (state: RootState, panelId: string) =>
  selectPanel(state, panelId)?.list

export const selectPanelDetails = (state: RootState, panelId: string) =>
  selectPanel(state, panelId)?.details

export const selectPanelType = (state: RootState, panelId: string) =>
  selectPanel(state, panelId)?.type

export const selectPanelSelectedIDs = (state: RootState, panelId: string) =>
  selectPanelList(state, panelId)?.selectedIDs || []

export const selectPanelPageSize = (
  state: RootState,
  panelId: string
): number => selectPanelList(state, panelId)?.pageSize || 25

export const selectPanelPageNumber = (state: RootState, panelId: string) =>
  selectPanelList(state, panelId)?.pageNumber

export const selectPanelSorting = (state: RootState, panelId: string) =>
  selectPanelList(state, panelId)?.sorting

export const selectPanelFilters = (state: RootState, panelId: string) =>
  selectPanelList(state, panelId)?.filters || {}

export const selectPanelVisibleColumns = (state: RootState, panelId: string) =>
  selectPanelList(state, panelId)?.visibleColumns

export const selectPanelCustom = (
  state: RootState,
  panelId: string,
  key: string
) => selectPanel(state, panelId)?.custom?.[key]
