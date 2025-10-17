import type {RootState} from "@/app/types"
import {
  closePanelAction,
  showDetailsInPanel,
  showListInPanel
} from "@/features/ui/panelActions"
import type {ThunkAction, UnknownAction} from "@reduxjs/toolkit"

export const showTagDetailsInPanel = (
  panelId: string,
  tagId: string
): ThunkAction<void, RootState, undefined, UnknownAction> => {
  return showDetailsInPanel(panelId, "tagDetails", tagId)
}

export const showTagListInPanel = (
  panelId: string
): ThunkAction<void, RootState, undefined, UnknownAction> => {
  return showListInPanel(panelId, "tagsList")
}

// Convenience wrappers for backward compatibility
export const showTagDetailsInSecondaryPanel = (
  tagId: string
): ThunkAction<void, RootState, undefined, UnknownAction> => {
  return showTagDetailsInPanel("secondary", tagId)
}

export const showTagDetailsInMainPanel = (
  tagId: string
): ThunkAction<void, RootState, undefined, UnknownAction> => {
  return showTagDetailsInPanel("main", tagId)
}

export const closeTagDetailsSecondaryPanel = (): ThunkAction<
  void,
  RootState,
  undefined,
  UnknownAction
> => {
  return closePanelAction("secondary")
}
