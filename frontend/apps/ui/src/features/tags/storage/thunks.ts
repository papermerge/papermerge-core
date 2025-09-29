import type {AppDispatch, RootState} from "@/app/types"
import {
  mainPanelTagDetailsUpdated,
  secondaryPanelTagDetailsUpdated
} from "@/features/tags/storage/tag"
import {
  mainPanelComponentUpdated,
  secondaryPanelComponentUpdated
} from "@/features/ui/uiSlice"
import type {ThunkAction, UnknownAction} from "@reduxjs/toolkit"

export const showTagDetailsInSecondaryPanel = (
  tagId: string
): ThunkAction<void, RootState, undefined, UnknownAction> => {
  return (dispatch: AppDispatch) => {
    dispatch(secondaryPanelTagDetailsUpdated(tagId))
    dispatch(secondaryPanelComponentUpdated("tagDetails"))
  }
}

export const showTagDetailsInMainPanel = (
  tagId: string
): ThunkAction<void, RootState, undefined, UnknownAction> => {
  return (dispatch: AppDispatch) => {
    dispatch(mainPanelTagDetailsUpdated(tagId))
    dispatch(mainPanelComponentUpdated("tagDetails"))
  }
}

export const closeTagDetailsSecondaryPanel = (): ThunkAction<
  void,
  RootState,
  undefined,
  UnknownAction
> => {
  return (dispatch: AppDispatch) => {
    dispatch(secondaryPanelTagDetailsUpdated(undefined))
    dispatch(secondaryPanelComponentUpdated(undefined))
  }
}
