import {useAppDispatch, useAppSelector} from "@/app/hooks"
import PanelContext from "@/contexts/PanelContext"
import {useContext, useMemo} from "react"
import {
  clearPanelSelection,
  resetPanel,
  resetPanelComponentState,
  selectCurrentComponentState,
  selectPanel,
  setPanelCustomState,
  setPanelDetails,
  setPanelList,
  updatePanelFilters,
  type PanelListState
} from "../panelRegistry"

export function usePanel() {
  const panelId = useContext(PanelContext)
  const dispatch = useAppDispatch()
  const panelState = useAppSelector(state => selectPanel(state, panelId))
  const componentState = useAppSelector(state =>
    selectCurrentComponentState(state, panelId)
  )

  const actions = useMemo(
    () => ({
      setList: (list: Partial<PanelListState>) => {
        dispatch(setPanelList({panelId, list}))
      },

      setDetails: (entityId: string) => {
        dispatch(setPanelDetails({panelId, entityId}))
      },

      setCustomState: (key: string, value: any) => {
        dispatch(setPanelCustomState({panelId, key, value}))
      },

      clearSelection: () => {
        dispatch(clearPanelSelection({panelId}))
      },

      updateFilters: (filters: Record<string, any>) => {
        dispatch(updatePanelFilters({panelId, filters}))
      },

      updatePagination: (pagination: {
        pageNumber?: number
        pageSize?: number
      }) => {
        dispatch(setPanelList({panelId, list: pagination}))
      },

      updateSorting: (sorting: any) => {
        dispatch(setPanelList({panelId, list: {sorting}}))
      },

      setSelection: (ids: string[]) => {
        dispatch(setPanelList({panelId, list: {selectedIDs: ids}}))
      },

      resetComponentState: () => {
        dispatch(resetPanelComponentState({panelId}))
      },

      reset: () => {
        dispatch(resetPanel({panelId}))
      }
    }),
    [panelId, dispatch]
  )

  return {
    panelId,
    panelState,
    componentState,
    actions
  }
}
