// features/roles/storage/role.ts
import {AppStartListening} from "@/app/listenerMiddleware"
import {RootState} from "@/app/types"
import type {PanelMode, ServerErrorType} from "@/types"
import {notifications} from "@mantine/notifications"
import {createSelector, createSlice} from "@reduxjs/toolkit"
import {t} from "i18next"
import {apiSliceWithRoles} from "./api"

// DOMAIN STATE ONLY - No UI concerns
export interface RoleSlice {
  // Nothing here! All data comes from RTK Query cache
  // This slice is now just for derived selectors
}

export const initialState: RoleSlice = {}

const rolesSlice = createSlice({
  name: "roles",
  initialState,
  reducers: {
    // No reducers needed - all mutations via RTK Query
  }
})

export default rolesSlice.reducer

// ============================================================================
// SELECTORS - Use RTK Query cache + Panel Registry
// ============================================================================

export const selectRolesResult = apiSliceWithRoles.endpoints.getRoles.select()

// Helper selectors for filtering
export const selectItemIds = (_: RootState, itemIds: string[]) => itemIds
export const selectItemId = (_: RootState, itemId: string) => itemId

export const selectRolesById = createSelector(
  [selectRolesResult, selectItemIds],
  (rolesData, roleIds) => {
    return rolesData.data?.filter(g => roleIds.includes(g.id))
  }
)

export const selectRoleById = createSelector(
  [selectRolesResult, selectItemId],
  (rolesData, roleId) => {
    return rolesData.data?.find(g => roleId == g.id)
  }
)

// ============================================================================
// PANEL-AWARE SELECTORS - Read from panelRegistry
// ============================================================================

const selectPanel = (state: RootState, panelId: string) =>
  state.panelRegistry.panels[panelId]

export const selectPanelList = (state: RootState, panelId: string) =>
  selectPanel(state, panelId)?.list

export const selectSelectedIDs = (state: RootState, panelId: string) =>
  selectPanelList(state, panelId)?.selectedIDs || []

export const selectPageSize = (state: RootState, panelId: string): number =>
  selectPanelList(state, panelId)?.pageSize || 25

export const selectPageNumber = (state: RootState, panelId: string) =>
  selectPanelList(state, panelId)?.pageNumber

export const selectSorting = (state: RootState, panelId: string) =>
  selectPanelList(state, panelId)?.sorting

export const selectVisibleColumns = (state: RootState, panelId: string) =>
  selectPanelList(state, panelId)?.visibleColumns

// Filter selectors
export const selectFilters = (state: RootState, panelId: string) =>
  selectPanelList(state, panelId)?.filters || {}

export const selectFreeTextFilter = (state: RootState, panelId: string) =>
  selectFilters(state, panelId).freeText

export const selectIncludeScopeFilter = (state: RootState, panelId: string) =>
  selectFilters(state, panelId).includeScopes || []

export const selectExcludeScopeFilter = (state: RootState, panelId: string) =>
  selectFilters(state, panelId).excludeScopes || []

// Details selector
export const selectDetailsEntityId = (state: RootState, panelId: string) =>
  selectPanel(state, panelId)?.details?.entityId

// Custom state (for expanded nodes, etc.)
export const selectFormExpandedNodes = (
  state: RootState,
  panelId: string
): string[] => selectPanel(state, panelId)?.custom?.expandedNodes || []

// ============================================================================
// BACKWARDS COMPATIBILITY - Convert PanelMode to panelId
// These can be removed once all components use panelId directly
// ============================================================================

export const selectSelectedIDsByMode = (state: RootState, mode: PanelMode) =>
  selectSelectedIDs(state, mode)

export const selectPageSizeByMode = (state: RootState, mode: PanelMode) =>
  selectPageSize(state, mode)

// ... add similar wrappers for other selectors during migration

// ============================================================================
// CRUD LISTENERS
// ============================================================================

export const roleCRUDListeners = (startAppListening: AppStartListening) => {
  // Create positive
  startAppListening({
    matcher: apiSliceWithRoles.endpoints.addNewRole.matchFulfilled,
    effect: async () => {
      notifications.show({
        withBorder: true,
        message: t("notifications.role.created.success")
      })
    }
  })

  // Update positive
  startAppListening({
    matcher: apiSliceWithRoles.endpoints.editRole.matchFulfilled,
    effect: async () => {
      notifications.show({
        withBorder: true,
        message: t("notifications.role.updated.success")
      })
    }
  })

  // Update negative
  startAppListening({
    matcher: apiSliceWithRoles.endpoints.editRole.matchRejected,
    effect: async action => {
      const error = action.payload as ServerErrorType
      notifications.show({
        autoClose: false,
        withBorder: true,
        color: "red",
        title: t("notifications.common.error"),
        message: error.data.detail
      })
    }
  })

  // Delete positive
  startAppListening({
    matcher: apiSliceWithRoles.endpoints.deleteRole.matchFulfilled,
    effect: async () => {
      notifications.show({
        withBorder: true,
        message: t("notifications.role.deleted.success")
      })
    }
  })

  // Delete negative
  startAppListening({
    matcher: apiSliceWithRoles.endpoints.deleteRole.matchRejected,
    effect: async action => {
      const error = action.payload as ServerErrorType
      notifications.show({
        autoClose: false,
        withBorder: true,
        color: "red",
        title: t("notifications.common.error"),
        message: error.data.detail
      })
    }
  })
}
