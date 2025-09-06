import type {AppDispatch, RootState} from "@/app/types"
import {
  mainPanelAuditLogDetailsUpdated,
  secondaryPanelAuditLogDetailsUpdated
} from "@/features/audit/storage/audit"
import {
  mainPanelComponentUpdated,
  secondaryPanelComponentUpdated
} from "@/features/ui/uiSlice"
import type {ThunkAction, UnknownAction} from "@reduxjs/toolkit"

export const showAuditLogDetailsInSecondaryPanel = (
  auditLogId: string
): ThunkAction<void, RootState, undefined, UnknownAction> => {
  return (dispatch: AppDispatch) => {
    dispatch(secondaryPanelAuditLogDetailsUpdated(auditLogId))
    dispatch(secondaryPanelComponentUpdated("auditLogDetails"))
  }
}

export const showAuditLogDetailsInMainPanel = (
  auditLogId: string
): ThunkAction<void, RootState, undefined, UnknownAction> => {
  return (dispatch: AppDispatch) => {
    dispatch(mainPanelAuditLogDetailsUpdated(auditLogId))
    dispatch(mainPanelComponentUpdated("auditLogDetails"))
  }
}

export const closeAuditLogDetailsSecondaryPanel = (): ThunkAction<
  void,
  RootState,
  undefined,
  UnknownAction
> => {
  return (dispatch: AppDispatch) => {
    dispatch(secondaryPanelAuditLogDetailsUpdated(undefined))
    dispatch(secondaryPanelComponentUpdated(undefined))
  }
}
