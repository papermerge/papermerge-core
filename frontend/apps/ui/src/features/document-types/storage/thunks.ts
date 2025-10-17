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

export const showDocumentTypeDetailsInPanel = (
  panelId: string,
  documentTypeId: string
): ThunkAction<void, RootState, undefined, UnknownAction> => {
  return showDetailsInPanel(panelId, "documentTypeDetails", documentTypeId)
}

export const showDocumentTypeListInPanel = (
  panelId: string
): ThunkAction<void, RootState, undefined, UnknownAction> => {
  return showListInPanel(panelId, "documentTypesList")
}

// Convenience wrappers for backward compatibility
export const showDocumentTypeDetailsInSecondaryPanel = (
  documentTypeId: string
): ThunkAction<void, RootState, undefined, UnknownAction> => {
  return showDocumentTypeDetailsInPanel("secondary", documentTypeId)
}

export const showDocumentTypeDetailsInMainPanel = (
  documentTypeId: string
): ThunkAction<void, RootState, undefined, UnknownAction> => {
  return showDocumentTypeDetailsInPanel("main", documentTypeId)
}

export const closeDocumentTypeDetailsSecondaryPanel = (): ThunkAction<
  void,
  RootState,
  undefined,
  UnknownAction
> => {
  return closePanelAction("secondary")
}
