import type {RootState} from "@/app/types"
import {
  closePanelAction,
  showDetailsInPanel,
  showListInPanel
} from "@/features/ui/panelActions"
import type {ThunkAction, UnknownAction} from "@reduxjs/toolkit"

export const showUserDetailsInPanel = (
  panelId: string,
  userId: string
): ThunkAction<void, RootState, undefined, UnknownAction> => {
  return showDetailsInPanel(panelId, "userDetails", userId)
}

export const showUserListInPanel = (
  panelId: string
): ThunkAction<void, RootState, undefined, UnknownAction> => {
  return showListInPanel(panelId, "usersList")
}

// Convenience wrappers for backward compatibility
export const showUserDetailsInSecondaryPanel = (
  userId: string
): ThunkAction<void, RootState, undefined, UnknownAction> => {
  return showUserDetailsInPanel("secondary", userId)
}

export const showUserDetailsInMainPanel = (
  userId: string
): ThunkAction<void, RootState, undefined, UnknownAction> => {
  return showUserDetailsInPanel("main", userId)
}

export const closeUserDetailsSecondaryPanel = (): ThunkAction<
  void,
  RootState,
  undefined,
  UnknownAction
> => {
  return closePanelAction("secondary")
}
