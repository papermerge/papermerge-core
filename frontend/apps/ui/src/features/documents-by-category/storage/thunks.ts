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

export const showDocumentsByCategoryDetailsInPanel = (
  panelId: string,
  documentsByCategoryId: string
): ThunkAction<void, RootState, undefined, UnknownAction> => {
  return showDetailsInPanel(
    panelId,
    "documentsByCategoryDetails",
    documentsByCategoryId
  )
}

export const showDocumentsByCategoryListInPanel = (
  panelId: string
): ThunkAction<void, RootState, undefined, UnknownAction> => {
  return showListInPanel(panelId, "documentsListByCategory")
}

// Convenience wrappers for backward compatibility
export const showDocumentDetailsInSecondaryPanel = (
  documentsByCategoryId: string
): ThunkAction<void, RootState, undefined, UnknownAction> => {
  return showDocumentsByCategoryDetailsInPanel(
    "secondary",
    documentsByCategoryId
  )
}

export const showDocumentsByCategoryDetailsInMainPanel = (
  documentsByCategoryId: string
): ThunkAction<void, RootState, undefined, UnknownAction> => {
  return showDocumentsByCategoryDetailsInPanel("main", documentsByCategoryId)
}

export const closeDocumentsByCategoryDetailsSecondaryPanel = (): ThunkAction<
  void,
  RootState,
  undefined,
  UnknownAction
> => {
  return closePanelAction("secondary")
}
