import type {AppDispatch, RootState} from "@/app/types"
import {
  mainPanelCustomFieldDetailsUpdated,
  secondaryPanelCustomFieldDetailsUpdated
} from "@/features/custom-fields/storage/custom_field"
import {
  mainPanelComponentUpdated,
  secondaryPanelComponentUpdated
} from "@/features/ui/uiSlice"
import type {ThunkAction, UnknownAction} from "@reduxjs/toolkit"

export const showCustomFieldDetailsInSecondaryPanel = (
  customFieldId: string
): ThunkAction<void, RootState, undefined, UnknownAction> => {
  return (dispatch: AppDispatch) => {
    dispatch(secondaryPanelCustomFieldDetailsUpdated(customFieldId))
    dispatch(secondaryPanelComponentUpdated("customFieldDetails"))
  }
}

export const showCustomFieldDetailsInMainPanel = (
  customFieldId: string
): ThunkAction<void, RootState, undefined, UnknownAction> => {
  return (dispatch: AppDispatch) => {
    dispatch(mainPanelCustomFieldDetailsUpdated(customFieldId))
    dispatch(mainPanelComponentUpdated("customFieldDetails"))
  }
}

export const closeCustomFieldDetailsSecondaryPanel = (): ThunkAction<
  void,
  RootState,
  undefined,
  UnknownAction
> => {
  return (dispatch: AppDispatch) => {
    dispatch(secondaryPanelCustomFieldDetailsUpdated(undefined))
    dispatch(secondaryPanelComponentUpdated(undefined))
  }
}
