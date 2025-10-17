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

export const showAuditLogDetailsInPanel = (
  panelId: string,
  auditLogId: string
): ThunkAction<void, RootState, undefined, UnknownAction> => {
  return showDetailsInPanel(panelId, "auditLogDetails", auditLogId)
}

export const showAuditLogListInPanel = (
  panelId: string
): ThunkAction<void, RootState, undefined, UnknownAction> => {
  return showListInPanel(panelId, "auditLogList")
}

// Convenience wrappers for backward compatibility
export const showAuditLogDetailsInSecondaryPanel = (
  auditLogId: string
): ThunkAction<void, RootState, undefined, UnknownAction> => {
  return showAuditLogDetailsInPanel("secondary", auditLogId)
}

export const showAuditLogDetailsInMainPanel = (
  auditLogId: string
): ThunkAction<void, RootState, undefined, UnknownAction> => {
  return showAuditLogDetailsInPanel("main", auditLogId)
}

export const closeAuditLogDetailsSecondaryPanel = (): ThunkAction<
  void,
  RootState,
  undefined,
  UnknownAction
> => {
  return closePanelAction("secondary")
}
