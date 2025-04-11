import {Box, Group, Stack} from "@mantine/core"
import {useContext, useState} from "react"

import {useAppDispatch, useAppSelector} from "@/app/hooks"
import type {BreadcrumbType, NType, NodeType, PanelMode} from "@/types"
import {useNavigate} from "react-router-dom"

import {
  currentNodeChanged,
  selectCurrentSharedNodeID,
  selectFilterText
} from "@/features/ui/uiSlice"

import Pagination from "@/components/Pagination"
import PanelContext from "@/contexts/PanelContext"
import {useGetFolderQuery} from "@/features/nodes/apiSlice"
import {useGetPaginatedSharedNodesQuery} from "@/features/shared_nodes/apiSlice"
import SharedBreadcrumb from "@/features/shared_nodes/components/SharedBreadcrumb"
import {
  commanderLastPageSizeUpdated,
  currentDocVerUpdated,
  selectCommanderSortMenuColumn,
  selectCommanderSortMenuDir,
  selectContentHeight,
  selectLastPageSize
} from "@/features/ui/uiSlice"
import classes from "./Commander.module.scss"
import Node from "./Node"

import {SHARED_FOLDER_ROOT_ID, SHARED_NODES_ROOT_BREADCRUMB} from "@/cconstants"
import {skipToken} from "@reduxjs/toolkit/query"
import FolderNodeActions from "./FolderNodeActions"

export default function SharedCommander() {
  const mode: PanelMode = useContext(PanelContext)
  const height = useAppSelector(s => selectContentHeight(s, mode))
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const lastPageSize = useAppSelector(s => selectLastPageSize(s, mode))
  const currentNodeID = useAppSelector(selectCurrentSharedNodeID)

  const [pageSize, setPageSize] = useState<number>(lastPageSize)
  const [page, setPage] = useState<number>(1)
  const filter = useAppSelector(s => selectFilterText(s, mode))
  const sortDir = useAppSelector(s => selectCommanderSortMenuDir(s, mode))
  const sortColumn = useAppSelector(s => selectCommanderSortMenuColumn(s, mode))

  const {data, isLoading, isFetching, isError} =
    useGetPaginatedSharedNodesQuery({
      nodeID: currentNodeID || SHARED_FOLDER_ROOT_ID,
      page_number: page,
      page_size: pageSize,
      filter: filter,
      sortDir: sortDir,
      sortColumn: sortColumn
    })

  const skipFolderQuery =
    currentNodeID == SHARED_FOLDER_ROOT_ID || !currentNodeID

  const {data: currentFolder} = useGetFolderQuery(
    skipFolderQuery ? skipToken : currentNodeID
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
        currentNodeChanged({id: node.id, ctype: node.ctype, panel: "secondary"})
      )
    }
    // mode == "main"
    switch (node.ctype) {
      case "folder":
        dispatch(currentDocVerUpdated({mode: mode, docVerID: undefined}))
        navigate(`/folder/${node.id}?page_size=${lastPageSize}`)
        break
      case "document":
        navigate(`/document/${node.id}`)
        break
    }
  }

  const onPageNumberChange = (page: number) => {
    setPage(page)
  }

  const onPageSizeChange = (value: string | null) => {
    if (value) {
      const pSize = parseInt(value)
      setPageSize(pSize)
      // reset current page
      setPage(1)
      // remember last page size
      dispatch(commanderLastPageSizeUpdated({pageSize: pSize, mode}))
    }
  }

  const nodes = data.items.map((n: NodeType) => (
    <Node onClick={onClick} key={n.id} node={n} />
  ))

  let commanderContent: JSX.Element

  if (nodes.length > 0) {
    commanderContent = (
      <>
        <Group>{nodes}</Group>
        <Pagination
          pagination={{
            pageNumber: page,
            pageSize: pageSize!,
            numPages: data.num_pages
          }}
          onPageNumberChange={onPageNumberChange}
          onPageSizeChange={onPageSizeChange}
          lastPageSize={lastPageSize}
        />
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
        <Stack
          className={classes.content}
          justify={"space-between"}
          style={{height: `${height}px`}}
        >
          {commanderContent}
        </Stack>
      </Box>
    </>
  )
}
