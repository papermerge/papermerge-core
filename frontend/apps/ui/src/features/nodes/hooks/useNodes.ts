import {useAppDispatch, useAppSelector} from "@/app/hooks"
import PanelContext from "@/contexts/PanelContext"
import {useGetFolderQuery} from "@/features/nodes/storage/api"
import type {SortBy} from "@/features/tags/types"
import {usePanel} from "@/features/ui/hooks/usePanel"
import {
  selectCurrentNodeID,
  selectPanelPageNumber,
  selectPanelPageSize,
  selectPanelSorting,
  setPanelComponent,
  setPanelList,
  updatePanelCurrentNode
} from "@/features/ui/panelRegistry"
import {skipToken} from "@reduxjs/toolkit/query"
import {useMemo} from "react"
import {useNavigate} from "react-router-dom"

import {useGetPaginatedNodesQuery} from "@/features/nodes/storage/api"
import type {NType, PanelMode} from "@/types"
import {useContext} from "react"

export default function useNodes() {
  const {panelId} = usePanel()
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const mode: PanelMode = useContext(PanelContext)
  const pageSize = useAppSelector(s => selectPanelPageSize(s, panelId)) || 10
  const pageNumber = useAppSelector(s => selectPanelPageNumber(s, panelId)) || 1
  const sorting = useAppSelector(s => selectPanelSorting(s, panelId))
  const currentNodeID = useAppSelector(s => selectCurrentNodeID(s, panelId))
  const {data: currentFolder} = useGetFolderQuery(currentNodeID ?? skipToken)

  const column = sorting?.column as SortBy | undefined

  const {data, isLoading, isFetching, isError, refetch, error} =
    useGetPaginatedNodesQuery(
      {
        nodeID: currentNodeID!,
        page_number: pageNumber,
        page_size: pageSize,
        filter: undefined,
        sortDir: "az",
        sortColumn: "title"
      },
      {skip: !currentNodeID}
    )

  const actions = useMemo(
    () => ({
      updateCurrentNode: (node: NType) => {
        const component = node.ctype == "folder" ? "commander" : "viewer"

        if (panelId == "secondary") {
          dispatch(
            setPanelComponent({
              panelId: "secondary",
              component
            })
          )
          return dispatch(
            updatePanelCurrentNode({
              entityID: node.id,
              panelID: "secondary",
              component
            })
          )
        }

        let url

        if (node.ctype == "folder") {
          url = `/folder/${node.id}`
        } else {
          url = `/document/${node.id}`
        }

        navigate(url)
      },

      updatePagination: (pagination: {
        pageNumber?: number
        pageSize?: number
      }) => {
        dispatch(setPanelList({panelId, list: pagination}))
      },

      setSelection: (ids: string[]) => {
        dispatch(setPanelList({panelId, list: {selectedIDs: ids}}))
      }
    }),
    [panelId, dispatch]
  )

  return {
    data,
    isLoading,
    isFetching,
    isError,
    refetch,
    error,
    actions,
    currentFolder
  }
}
