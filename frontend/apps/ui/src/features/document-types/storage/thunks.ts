import type {AppDispatch, RootState} from "@/app/types"
import {
  mainPanelDocumentTypeDetailsUpdated,
  secondaryPanelDocumentTypeDetailsUpdated
} from "@/features/document-types/storage/documentType"
import {
  mainPanelComponentUpdated,
  secondaryPanelComponentUpdated
} from "@/features/ui/uiSlice"
import type {ThunkAction, UnknownAction} from "@reduxjs/toolkit"

export const showDocumentTypeDetailsInSecondaryPanel = (
  documentTypeId: string
): ThunkAction<void, RootState, undefined, UnknownAction> => {
  return (dispatch: AppDispatch) => {
    dispatch(secondaryPanelDocumentTypeDetailsUpdated(documentTypeId))
    dispatch(secondaryPanelComponentUpdated("documentTypeDetails"))
  }
}

export const showDocumentTypeDetailsInMainPanel = (
  documentTypeId: string
): ThunkAction<void, RootState, undefined, UnknownAction> => {
  return (dispatch: AppDispatch) => {
    dispatch(mainPanelDocumentTypeDetailsUpdated(documentTypeId))
    dispatch(mainPanelComponentUpdated("documentTypeDetails"))
  }
}

export const closeDocumentTypeDetailsSecondaryPanel = (): ThunkAction<
  void,
  RootState,
  undefined,
  UnknownAction
> => {
  return (dispatch: AppDispatch) => {
    dispatch(secondaryPanelDocumentTypeDetailsUpdated(undefined))
    dispatch(secondaryPanelComponentUpdated(undefined))
  }
}
