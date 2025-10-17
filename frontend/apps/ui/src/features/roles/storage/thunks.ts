import type {RootState} from "@/app/types"
import {
  closePanelAction,
  showDetailsInPanel,
  showListInPanel
} from "@/features/ui/panelActions"
import type {ThunkAction, UnknownAction} from "@reduxjs/toolkit"

// ============================================================================
// ROLE-SPECIFIC ACTIONS
// ============================================================================

export const showRoleDetailsInPanel = (
  panelId: string,
  roleId: string
): ThunkAction<void, RootState, undefined, UnknownAction> => {
  return showDetailsInPanel(panelId, "roleDetails", roleId)
}

export const showRoleListInPanel = (
  panelId: string
): ThunkAction<void, RootState, undefined, UnknownAction> => {
  return showListInPanel(panelId, "rolesList")
}

// Convenience wrappers for backward compatibility
export const showRoleDetailsInSecondaryPanel = (
  roleId: string
): ThunkAction<void, RootState, undefined, UnknownAction> => {
  return showRoleDetailsInPanel("secondary", roleId)
}

export const showRoleDetailsInMainPanel = (
  roleId: string
): ThunkAction<void, RootState, undefined, UnknownAction> => {
  return showRoleDetailsInPanel("main", roleId)
}

export const closeRoleDetailsSecondaryPanel = (): ThunkAction<
  void,
  RootState,
  undefined,
  UnknownAction
> => {
  return closePanelAction("secondary")
}
