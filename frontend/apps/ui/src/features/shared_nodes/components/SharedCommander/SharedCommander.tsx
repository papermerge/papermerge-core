import {Box, Group, Stack} from "@mantine/core"
import {useContext, useState} from "react"

import {useAppDispatch, useAppSelector} from "@/app/hooks"
import type {BreadcrumbType, NType, PanelMode} from "@/types"
import {useNavigate} from "react-router-dom"

import {
  currentSharedNodeChanged,
  currentSharedNodeRootChanged,
  selectCurrentSharedNodeID,
  selectCurrentSharedRootID
} from "@/features/ui/uiSlice"
import {TablePagination} from "kommon"

import {store} from "@/app/store"
import SharedBreadcrumb from "@/components/SharedBreadcrumb"
import PanelContext from "@/contexts/PanelContext"
import {
  useGetPaginatedSharedNodesQuery,
  useGetSharedFolderQuery
} from "@/features/shared_nodes/store/apiSlice"
import {
  currentDocVerUpdated,
  selectCommanderSortMenuColumn,
  selectCommanderSortMenuDir
} from "@/features/ui/uiSlice"
import classes from "./Commander.module.scss"
import NodesList from "./NodesList"

import {SHARED_FOLDER_ROOT_ID, SHARED_NODES_ROOT_BREADCRUMB} from "@/cconstants"
import {skipToken} from "@reduxjs/toolkit/query"
import FolderNodeActions from "./FolderNodeActions"

export default function SharedCommander() {
  const mode: PanelMode = useContext(PanelContext)
  const dispatch = useAppDispatch()
  const navigate = useNavigate()

  const currentNodeID = useAppSelector(selectCurrentSharedNodeID)
  const currentSharedRootID = useAppSelector(selectCurrentSharedRootID)

  const [page, setPage] = useState<number>(1)

  const sortDir = useAppSelector(s => selectCommanderSortMenuDir(s, mode))
  const sortColumn = useAppSelector(s => selectCommanderSortMenuColumn(s, mode))

  const {data, isLoading, isFetching, isError} =
    useGetPaginatedSharedNodesQuery({
      nodeID: currentNodeID || SHARED_FOLDER_ROOT_ID,
      page_number: page,
      page_size: 5,
      sortDir: sortDir,
      sortColumn: sortColumn
    })

  const skipFolderQuery =
    currentNodeID == SHARED_FOLDER_ROOT_ID || !currentNodeID

  const {data: currentFolder} = useGetSharedFolderQuery(
    skipFolderQuery ? skipToken : {nodeID: currentNodeID, currentSharedRootID}
  )

  if (isLoading && !data) {
    return <div>Loading...</div>
  }

  if (isError) {
    return <div>{`some error`}</div>
  }

  if (!data) {
    return <div>Data is null</div>
  }

  const onClick = (node: NType) => {
    if (mode == "secondary") {
      return dispatch(
        currentSharedNodeChanged({
          id: node.id,
          ctype: node.ctype,
          panel: "secondary"
        })
      )
    }

    if (node.ctype == "folder") {
      if (node.id == SHARED_FOLDER_ROOT_ID) {
        dispatch(currentSharedNodeRootChanged(undefined))
        navigate(`/shared`)
        return
      }
    }

    // mode == "main"
    switch (node.ctype) {
      case "folder":
        const state = store.getState()
        const sharedNode = state.sharedNodes.entities[node.id]
        if (sharedNode.is_shared_root) {
          dispatch(currentSharedNodeRootChanged(node.id))
        }
        dispatch(currentDocVerUpdated({mode: mode, docVerID: undefined}))
        navigate(`/shared/folder/${node.id}`)
        break
      case "document":
        navigate(`/shared/document/${node.id}`)
        break
    }
  }

  const onPageNumberChange = (page: number) => {
    setPage(page)
  }

  const onPageSizeChange = (value: number) => {}

  let commanderContent

  if (data.items.length > 0) {
    commanderContent = (
      <>
        <Group>
          <NodesList items={data.items} onClick={onClick} />
        </Group>
      </>
    )
  } else {
    commanderContent = <Group>Empty</Group>
  }

  return (
    <>
      <Box>
        <FolderNodeActions />
        <SharedBreadcrumb
          breadcrumb={
            currentFolder?.breadcrumb ||
            (SHARED_NODES_ROOT_BREADCRUMB as BreadcrumbType)
          }
          onClick={onClick}
          isFetching={isFetching}
        />
        <Stack className={classes.content} justify={"space-between"}>
          {commanderContent}
        </Stack>
        <TablePagination
          currentPage={data?.page_number || 1}
          totalPages={data?.num_pages || 0}
          pageSize={data?.page_size || 15}
          onPageChange={onPageNumberChange}
          onPageSizeChange={onPageSizeChange}
          totalItems={data?.total_items}
          t={t}
        />
      </Box>
    </>
  )
}
