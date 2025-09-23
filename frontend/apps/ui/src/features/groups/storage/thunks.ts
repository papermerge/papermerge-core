import type {AppDispatch, RootState} from "@/app/types"
import {
  mainPanelGroupDetailsUpdated,
  secondaryPanelGroupDetailsUpdated
} from "@/features/groups/storage/group"
import {
  mainPanelComponentUpdated,
  secondaryPanelComponentUpdated
} from "@/features/ui/uiSlice"
import type {ThunkAction, UnknownAction} from "@reduxjs/toolkit"

export const showGroupDetailsInSecondaryPanel = (
  groupId: string
): ThunkAction<void, RootState, undefined, UnknownAction> => {
  return (dispatch: AppDispatch) => {
    dispatch(secondaryPanelGroupDetailsUpdated(groupId))
    dispatch(secondaryPanelComponentUpdated("groupDetails"))
  }
}

export const showGroupDetailsInMainPanel = (
  groupId: string
): ThunkAction<void, RootState, undefined, UnknownAction> => {
  return (dispatch: AppDispatch) => {
    dispatch(mainPanelGroupDetailsUpdated(groupId))
    dispatch(mainPanelComponentUpdated("groupDetails"))
  }
}

export const closeGroupDetailsSecondaryPanel = (): ThunkAction<
  void,
  RootState,
  undefined,
  UnknownAction
> => {
  return (dispatch: AppDispatch) => {
    dispatch(secondaryPanelGroupDetailsUpdated(undefined))
    dispatch(secondaryPanelComponentUpdated(undefined))
  }
}
