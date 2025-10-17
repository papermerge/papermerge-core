// features/ui/panelActions.ts
import type {AppDispatch, RootState} from "@/app/types"
import type {PanelComponent} from "@/types.d/ui"
import type {ThunkAction, UnknownAction} from "@reduxjs/toolkit"
import {
  closePanel,
  setPanelComponent,
  setPanelDetails,
  setPanelType
} from "./panelRegistry"

// ============================================================================
// GENERIC PANEL ACTIONS - Work for ANY feature
// ============================================================================

/**
 * Show a details view in the specified panel
 * @param panelId - The panel identifier (e.g., "main", "secondary")
 * @param component - The component to render (e.g., "roleDetails", "userDetails")
 * @param entityId - The ID of the entity to display
 */
export const showDetailsInPanel = (
  panelId: string,
  component: PanelComponent,
  entityId: string
): ThunkAction<void, RootState, undefined, UnknownAction> => {
  return (dispatch: AppDispatch) => {
    dispatch(setPanelComponent({panelId, component}))
    dispatch(setPanelType({panelId, type: "details"}))
    dispatch(setPanelDetails({panelId, entityId}))
  }
}

/**
 * Show a list view in the specified panel
 * @param panelId - The panel identifier (e.g., "main", "secondary")
 * @param component - The component to render (e.g., "rolesList", "usersList")
 */
export const showListInPanel = (
  panelId: string,
  component: PanelComponent
): ThunkAction<void, RootState, undefined, UnknownAction> => {
  return (dispatch: AppDispatch) => {
    dispatch(setPanelComponent({panelId, component}))
    dispatch(setPanelType({panelId, type: "list"}))
  }
}

/**
 * Close/reset the specified panel
 * @param panelId - The panel identifier (e.g., "secondary")
 */
export const closePanelAction = (
  panelId: string
): ThunkAction<void, RootState, undefined, UnknownAction> => {
  return (dispatch: AppDispatch) => {
    dispatch(closePanel({panelId}))
  }
}
