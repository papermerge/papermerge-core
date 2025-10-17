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

export const showCustomFieldDetailsInPanel = (
  panelId: string,
  customFieldId: string
): ThunkAction<void, RootState, undefined, UnknownAction> => {
  return showDetailsInPanel(panelId, "customFieldDetails", customFieldId)
}

export const showCustomFieldListInPanel = (
  panelId: string
): ThunkAction<void, RootState, undefined, UnknownAction> => {
  return showListInPanel(panelId, "customFieldsList")
}

// Convenience wrappers for backward compatibility
export const showCustomFieldDetailsInSecondaryPanel = (
  customFieldId: string
): ThunkAction<void, RootState, undefined, UnknownAction> => {
  return showCustomFieldDetailsInPanel("secondary", customFieldId)
}

export const showCustomFieldDetailsInMainPanel = (
  customFieldId: string
): ThunkAction<void, RootState, undefined, UnknownAction> => {
  return showCustomFieldDetailsInPanel("main", customFieldId)
}

export const closeCustomFieldDetailsSecondaryPanel = (): ThunkAction<
  void,
  RootState,
  undefined,
  UnknownAction
> => {
  return closePanelAction("secondary")
}
