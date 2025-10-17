// features/ui/panelRegistry.ts
import type {RootState} from "@/app/types"
import type {PanelComponent} from "@/types.d/ui"
import {createSlice, PayloadAction} from "@reduxjs/toolkit"
import type {SortState} from "kommon"

// ============================================================================
// TYPES
// ============================================================================

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

export interface ComponentState {
  list?: PanelListState
  details?: PanelDetailsState
  custom?: Record<string, any>
}

export interface PanelState {
  // What component should be rendered in this panel
  component?: PanelComponent
  // What type of view (list, details, etc.)
  type: "list" | "details" | "viewer" | "commander" | "search"
  // State organized by component name
  // e.g., { rolesList: { list: {...} }, usersList: { list: {...} } }
  componentStates: {
    [componentName: string]: ComponentState
  }
}

export interface PanelRegistryState {
  panels: {
    [panelId: string]: PanelState
  }
}

// ============================================================================
// INITIAL STATE
// ============================================================================

const initialState: PanelRegistryState = {
  panels: {
    main: {
      type: "list",
      component: undefined,
      componentStates: {}
    },
    secondary: {
      type: "list",
      component: undefined,
      componentStates: {}
    }
  }
}

// ============================================================================
// SLICE
// ============================================================================

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
        state.panels[panelId] = {
          type: "list",
          componentStates: {}
        }
      }
      state.panels[panelId].component = component

      // Initialize component state if it doesn't exist
      if (component && !state.panels[panelId].componentStates[component]) {
        state.panels[panelId].componentStates[component] = {}
      }
    },

    // Update list state for current component
    setPanelList: (
      state,
      action: PayloadAction<{
        panelId: string
        list: Partial<PanelListState>
      }>
    ) => {
      const {panelId, list} = action.payload
      const panel = state.panels[panelId]
      const component = panel?.component

      if (!component) {
        console.warn(`setPanelList: No component set for panel ${panelId}`)
        return
      }

      if (!panel.componentStates[component]) {
        panel.componentStates[component] = {}
      }

      panel.type = "list"
      panel.componentStates[component].list = {
        ...panel.componentStates[component].list,
        ...list
      }
    },

    // Update filters for current component
    updatePanelFilters: (
      state,
      action: PayloadAction<{
        panelId: string
        filters: Record<string, any>
      }>
    ) => {
      const {panelId, filters} = action.payload
      const panel = state.panels[panelId]
      const component = panel?.component

      if (!component) {
        console.warn(
          `updatePanelFilters: No component set for panel ${panelId}`
        )
        return
      }

      if (!panel.componentStates[component]) {
        panel.componentStates[component] = {}
      }

      if (!panel.componentStates[component].list) {
        panel.componentStates[component].list = {}
      }

      panel.componentStates[component].list!.filters = {
        ...panel.componentStates[component].list!.filters,
        ...filters
      }
    },

    // Set details state for current component
    setPanelDetails: (
      state,
      action: PayloadAction<{
        panelId: string
        entityId: string
      }>
    ) => {
      const {panelId, entityId} = action.payload
      const panel = state.panels[panelId]
      const component = panel?.component

      if (!component) {
        console.warn(`setPanelDetails: No component set for panel ${panelId}`)
        return
      }

      if (!panel.componentStates[component]) {
        panel.componentStates[component] = {}
      }

      panel.type = "details"
      panel.componentStates[component].details = {entityId}
    },

    // Set panel type
    setPanelType: (
      state,
      action: PayloadAction<{
        panelId: string
        type: PanelState["type"]
      }>
    ) => {
      const {panelId, type} = action.payload
      if (!state.panels[panelId]) {
        state.panels[panelId] = {type, componentStates: {}}
      }
      state.panels[panelId].type = type
    },

    // Set custom state for current component
    setPanelCustomState: (
      state,
      action: PayloadAction<{
        panelId: string
        key: string
        value: any
      }>
    ) => {
      const {panelId, key, value} = action.payload
      const panel = state.panels[panelId]
      const component = panel?.component

      if (!component) {
        console.warn(
          `setPanelCustomState: No component set for panel ${panelId}`
        )
        return
      }

      if (!panel.componentStates[component]) {
        panel.componentStates[component] = {}
      }

      if (!panel.componentStates[component].custom) {
        panel.componentStates[component].custom = {}
      }

      panel.componentStates[component].custom![key] = value
    },

    // Clear selection for current component
    clearPanelSelection: (state, action: PayloadAction<{panelId: string}>) => {
      const {panelId} = action.payload
      const panel = state.panels[panelId]
      const component = panel?.component

      if (!component) return

      if (panel.componentStates[component]?.list) {
        panel.componentStates[component].list!.selectedIDs = []
      }
    },

    // Reset current component's state
    resetPanelComponentState: (
      state,
      action: PayloadAction<{panelId: string}>
    ) => {
      const {panelId} = action.payload
      const panel = state.panels[panelId]
      const component = panel?.component

      if (!component) return

      panel.componentStates[component] = {}
    },

    // Reset entire panel (all components)
    resetPanel: (state, action: PayloadAction<{panelId: string}>) => {
      const {panelId} = action.payload
      state.panels[panelId] = {
        type: "list",
        component: undefined,
        componentStates: {}
      }
    },

    // Close a panel (typically secondary)
    closePanel: (state, action: PayloadAction<{panelId: string}>) => {
      const {panelId} = action.payload
      state.panels[panelId] = {
        type: "list",
        component: undefined,
        componentStates: {}
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
  resetPanelComponentState,
  resetPanel,
  closePanel
} = panelRegistrySlice.actions

export default panelRegistrySlice.reducer

// ============================================================================
// SELECTORS
// ============================================================================

export const selectPanel = (state: RootState, panelId: string) =>
  state.panelRegistry.panels[panelId]

export const selectPanelComponent = (state: RootState, panelId: string) =>
  selectPanel(state, panelId)?.component

export const selectPanelType = (state: RootState, panelId: string) =>
  selectPanel(state, panelId)?.type

// Get the state for the currently active component in the panel
export const selectCurrentComponentState = (
  state: RootState,
  panelId: string
): ComponentState | undefined => {
  const panel = selectPanel(state, panelId)
  const component = panel?.component
  return component ? panel?.componentStates[component] : undefined
}

// Get state for a specific component (whether it's active or not)
export const selectComponentState = (
  state: RootState,
  panelId: string,
  componentName: string
): ComponentState | undefined => {
  const panel = selectPanel(state, panelId)
  return panel?.componentStates[componentName]
}

// List state selectors (for current component)
export const selectPanelList = (state: RootState, panelId: string) =>
  selectCurrentComponentState(state, panelId)?.list

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

// Details state selectors (for current component)
export const selectPanelDetails = (state: RootState, panelId: string) =>
  selectCurrentComponentState(state, panelId)?.details

export const selectPanelDetailsEntityId = (state: RootState, panelId: string) =>
  selectPanelDetails(state, panelId)?.entityId

// Custom state selectors (for current component)
export const selectPanelCustom = (
  state: RootState,
  panelId: string,
  key: string
) => selectCurrentComponentState(state, panelId)?.custom?.[key]

export const selectPanelAllCustom = (state: RootState, panelId: string) =>
  selectCurrentComponentState(state, panelId)?.custom || {}
