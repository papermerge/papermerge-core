import type {AppDispatch, RootState} from "@/app/types"
import {
  mainPanelDocumentsByCategoryDetailsUpdated,
  secondaryPanelDocumentsByCategoryDetailsUpdated
} from "@/features/documents-by-category/storage/documentsByCategory"
import {
  mainPanelComponentUpdated,
  secondaryPanelComponentUpdated
} from "@/features/ui/uiSlice"
import type {ThunkAction, UnknownAction} from "@reduxjs/toolkit"

export const showDocumentDetailsInSecondaryPanel = (
  documentId: string
): ThunkAction<void, RootState, undefined, UnknownAction> => {
  return (dispatch: AppDispatch) => {
    dispatch(secondaryPanelDocumentsByCategoryDetailsUpdated(documentId))
    dispatch(secondaryPanelComponentUpdated("documentsByCategoryDetails"))
  }
}

export const showDocumentDetailsInMainPanel = (
  documentId: string
): ThunkAction<void, RootState, undefined, UnknownAction> => {
  return (dispatch: AppDispatch) => {
    dispatch(mainPanelDocumentsByCategoryDetailsUpdated(documentId))
    dispatch(mainPanelComponentUpdated("documentsByCategoryDetails"))
  }
}

export const closeDocumentDetailsSecondaryPanel = (): ThunkAction<
  void,
  RootState,
  undefined,
  UnknownAction
> => {
  return (dispatch: AppDispatch) => {
    dispatch(secondaryPanelDocumentsByCategoryDetailsUpdated(undefined))
    dispatch(secondaryPanelComponentUpdated(undefined))
  }
}
