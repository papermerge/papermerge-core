import {useAppDispatch, useAppSelector} from "@/app/hooks"
import {
  useGetFolderQuery,
  useGetPaginatedNodesQuery
} from "@/features/nodes/storage/api"
import {useGetPaginatedSharedRootNodesQuery} from "@/features/shared_nodes/store/apiSlice"
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

import type {NodeQueryParams, SortBy} from "@/features/nodes/types"
import type {NType} from "@/types"

/**
 * Returns all shared nodes
 */
export default function useNodes() {
  const queryParams = useQueryParams()
  const {panelId} = usePanel()
  const dispatch = useAppDispatch()
  const navigate = useNavigate()

  const currentNodeID = useAppSelector(s => selectCurrentNodeID(s, panelId))
  const {data: currentFolder} = useGetFolderQuery(currentNodeID ?? skipToken)

  const {data, isLoading, isFetching, isError, refetch, error} =
    useGetSharedNodes(queryParams, currentNodeID)

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

/**
 * Get all shared nodes
 *
 * If `nodeID` is empty -> query `/api/shared-nodes` to get top all level shared nodes
 * If `nodeID` is not empty -> query `/api/shared-nodes/folder/<nodeID>` for
 * all shared nodes whole parend is `nodeID`
 */
function useGetSharedNodes(queryParams: NodeQueryParams, nodeID?: string) {
  const isRootLevel = !nodeID
  const {
    data: data1,
    isLoading: isLoading1,
    isFetching: isFetching1,
    isError: isError1,
    refetch: refetch1,
    error: error1
  } = useGetPaginatedSharedRootNodesQuery(
    {
      queryParams
    },
    {skip: !isRootLevel}
  )

  const {
    data: data2,
    isLoading: isLoading2,
    isFetching: isFetching2,
    isError: isError2,
    refetch: refetch2,
    error: error2
  } = useGetPaginatedNodesQuery(
    {
      nodeID: nodeID!,
      queryParams
    },
    {skip: isRootLevel}
  )

  return {
    data: isRootLevel ? data1 : data2,
    isLoading: isRootLevel ? isLoading1 : isLoading2,
    isFetching: isRootLevel ? isFetching1 : isFetching2,
    isError: isRootLevel ? isError1 : isError2,
    refetch: isRootLevel ? refetch1 : refetch2,
    error: isRootLevel ? error1 : error2
  }
}
