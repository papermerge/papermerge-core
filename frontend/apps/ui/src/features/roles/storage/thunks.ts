import type {AppDispatch, RootState} from "@/app/types"
import {
  mainPanelRoleDetailsUpdated,
  secondaryPanelRoleDetailsUpdated
} from "@/features/roles/storage/role"
import {
  mainPanelComponentUpdated,
  secondaryPanelComponentUpdated
} from "@/features/ui/uiSlice"
import type {ThunkAction, UnknownAction} from "@reduxjs/toolkit"

export const showRoleDetailsInSecondaryPanel = (
  roleId: string
): ThunkAction<void, RootState, undefined, UnknownAction> => {
  return (dispatch: AppDispatch) => {
    dispatch(secondaryPanelRoleDetailsUpdated(roleId))
    dispatch(secondaryPanelComponentUpdated("roleDetails"))
  }
}

export const showRoleDetailsInMainPanel = (
  roleId: string
): ThunkAction<void, RootState, undefined, UnknownAction> => {
  return (dispatch: AppDispatch) => {
    dispatch(mainPanelRoleDetailsUpdated(roleId))
    dispatch(mainPanelComponentUpdated("roleDetails"))
  }
}

export const closeRoleDetailsSecondaryPanel = (): ThunkAction<
  void,
  RootState,
  undefined,
  UnknownAction
> => {
  return (dispatch: AppDispatch) => {
    dispatch(secondaryPanelRoleDetailsUpdated(undefined))
    dispatch(secondaryPanelComponentUpdated(undefined))
  }
}
