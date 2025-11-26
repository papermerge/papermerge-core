import {useAppDispatch, useAppSelector} from "@/app/hooks"
import {useGetFolderQuery} from "@/features/nodes/storage/api"
import {usePanel} from "@/features/ui/hooks/usePanel"
import {
  selectCurrentNodeID,
  selectPanelFilters,
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
import type {NodeQueryParams, SortBy} from "@/features/nodes/types"
import type {NType} from "@/types"

export default function useNodes() {
  const queryParams = useQueryParams()
  const {panelId} = usePanel()
  const dispatch = useAppDispatch()
  const navigate = useNavigate()

  const currentNodeID = useAppSelector(s => selectCurrentNodeID(s, panelId))
  const {data: currentFolder} = useGetFolderQuery(currentNodeID ?? skipToken)

  const {data, isLoading, isFetching, isError, refetch, error} =
    useGetPaginatedNodesQuery(
      {
        nodeID: currentNodeID!,
        queryParams: queryParams
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
      }, // updateCurrentNode

      updatePagination: (pagination: {
        pageNumber?: number
        pageSize?: number
      }) => {
        dispatch(setPanelList({panelId, list: pagination}))
      }, // updatePagination

      updateSorting: (sorting: any) => {
        dispatch(setPanelList({panelId, list: {sorting}}))
      },

      setSelection: (ids: string[]) => {
        dispatch(setPanelList({panelId, list: {selectedIDs: ids}}))
      } // setSelection
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
    currentFolder,
    queryParams
  }
}

function useQueryParams(): NodeQueryParams {
  const {panelId} = usePanel()

  const pageSize = useAppSelector(s => selectPanelPageSize(s, panelId)) || 10
  const pageNumber = useAppSelector(s => selectPanelPageNumber(s, panelId)) || 1
  const sorting = useAppSelector(s => selectPanelSorting(s, panelId))
  const filters = useAppSelector(s => selectPanelFilters(s, panelId))

  const column = sorting?.column as SortBy | undefined
  const free_text = filters.freeText

  const queryParams: NodeQueryParams = {
    page_size: pageSize,
    page_number: pageNumber,
    sort_by: column,
    sort_direction: sorting?.direction || undefined,
    filter_free_text: free_text
  }

  return queryParams
}
