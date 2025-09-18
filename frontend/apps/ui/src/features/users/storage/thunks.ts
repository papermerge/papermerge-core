import type {AppDispatch, RootState} from "@/app/types"
import {
  mainPanelComponentUpdated,
  secondaryPanelComponentUpdated
} from "@/features/ui/uiSlice"
import {
  mainPanelUserDetailsUpdated,
  secondaryPanelUserDetailsUpdated
} from "@/features/users/storage/user"
import type {ThunkAction, UnknownAction} from "@reduxjs/toolkit"

export const showUserDetailsInSecondaryPanel = (
  userId: string
): ThunkAction<void, RootState, undefined, UnknownAction> => {
  return (dispatch: AppDispatch) => {
    dispatch(secondaryPanelUserDetailsUpdated(userId))
    dispatch(secondaryPanelComponentUpdated("userDetails"))
  }
}

export const showUserDetailsInMainPanel = (
  userId: string
): ThunkAction<void, RootState, undefined, UnknownAction> => {
  return (dispatch: AppDispatch) => {
    dispatch(mainPanelUserDetailsUpdated(userId))
    dispatch(mainPanelComponentUpdated("userDetails"))
  }
}

export const closeRoleDetailsSecondaryPanel = (): ThunkAction<
  void,
  RootState,
  undefined,
  UnknownAction
> => {
  return (dispatch: AppDispatch) => {
    dispatch(secondaryPanelUserDetailsUpdated(undefined))
    dispatch(secondaryPanelComponentUpdated(undefined))
  }
}
