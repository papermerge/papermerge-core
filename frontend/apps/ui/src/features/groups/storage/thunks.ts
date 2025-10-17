import type {RootState} from "@/app/types"
import {
  closePanelAction,
  showDetailsInPanel,
  showListInPanel
} from "@/features/ui/panelActions"
import type {ThunkAction, UnknownAction} from "@reduxjs/toolkit"

// ============================================================================
// GROUP-SPECIFIC ACTIONS
// ============================================================================

export const showGroupDetailsInPanel = (
  panelId: string,
  groupId: string
): ThunkAction<void, RootState, undefined, UnknownAction> => {
  return showDetailsInPanel(panelId, "groupDetails", groupId)
}

export const showGroupListInPanel = (
  panelId: string
): ThunkAction<void, RootState, undefined, UnknownAction> => {
  return showListInPanel(panelId, "groupsList")
}

// Convenience wrappers for backward compatibility
export const showGroupDetailsInSecondaryPanel = (
  groupId: string
): ThunkAction<void, RootState, undefined, UnknownAction> => {
  return showGroupDetailsInPanel("secondary", groupId)
}

export const showGroupDetailsInMainPanel = (
  groupId: string
): ThunkAction<void, RootState, undefined, UnknownAction> => {
  return showGroupDetailsInPanel("main", groupId)
}

export const closeGroupDetailsSecondaryPanel = (): ThunkAction<
  void,
  RootState,
  undefined,
  UnknownAction
> => {
  return closePanelAction("secondary")
}
