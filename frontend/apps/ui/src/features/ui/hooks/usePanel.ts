// features/ui/hooks/usePanel.ts
import {useAppDispatch, useAppSelector} from "@/app/hooks"
import PanelContext from "@/contexts/PanelContext"
import {useContext, useMemo} from "react"
import {
  clearPanelSelection,
  setPanelCustomState,
  setPanelDetails,
  setPanelList,
  type PanelListState
} from "../panelRegistry"

export function usePanel() {
  const panelId = useContext(PanelContext)
  const dispatch = useAppDispatch()
  const panelState = useAppSelector(
    state => state.panelRegistry.panels[panelId]
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
        dispatch(
          setPanelList({
            panelId,
            list: {
              filters: {
                ...panelState?.list?.filters,
                ...filters
              }
            }
          })
        )
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
      }
    }),
    [panelId, dispatch, panelState]
  )

  return {
    panelId,
    panelState,
    actions
  }
}
