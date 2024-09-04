import {useContext, useState} from "react"
import {Group, Stack, Box} from "@mantine/core"

import {useSelector, useDispatch} from "react-redux"
import {useNavigate} from "react-router-dom"

import FolderNodeActions from "@/components/Commander/FolderNodeActions"
import Node from "@/components/Node"
import {
  selectPanelNodes,
  setCurrentNode,
  fetchPaginatedNodes,
  selectPagination,
  selectLastPageSize,
  selectCurrentFolderID,
  selectCurrentFolder,
  selectCommanderPageSize,
  selectCommanderPageNumber,
  fetchPaginatedDocument
} from "@/slices/dualPanel/dualPanel"

import type {RootState} from "@/app/types"
import type {NType, NodeType, PanelMode} from "@/types"
import Breadcrumbs from "@/components/Breadcrumbs"
import Pagination from "@/components/Pagination"
import PanelContext from "@/contexts/PanelContext"
import drop_files from "@/components/modals/DropFiles"
import {selectContentHeight} from "@/slices/sizes"
import classes from "./Commander.module.scss"
import {useGetPaginatedNodesQuery} from "@/features/nodes/apiSlice"

export default function Commander() {
  const [dragOver, setDragOver] = useState<boolean>(false)
  const mode: PanelMode = useContext(PanelContext)
  const height = useSelector((state: RootState) =>
    selectContentHeight(state, mode)
  )
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const lastPageSize = useSelector((state: RootState) =>
    selectLastPageSize(state, mode)
  )
  const currentNodeID = useSelector((state: RootState) =>
    selectCurrentFolderID(state, mode)
  )
  const pageSize = useSelector((state: RootState) =>
    selectCommanderPageSize(state, mode)
  )
  const [page, setPage] = useState<number>(1)

  const {data, isLoading, isFetching, isError} = useGetPaginatedNodesQuery({
    nodeID: currentNodeID!,
    page_number: page,
    page_size: pageSize
  })

  const currentFolder = useSelector((state: RootState) =>
    selectCurrentFolder(state, mode)
  )
  const pagination = useSelector((state: RootState) =>
    selectPagination(state, mode)
  )

  const pageNumber = useSelector((state: RootState) =>
    selectCommanderPageNumber(state, mode)
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
    if (mode == "secondary" && node.ctype == "folder") {
      dispatch(
        fetchPaginatedNodes({
          nodeId: node.id,
          panel: "secondary",
          urlParams: new URLSearchParams(`page_size=${lastPageSize}`)
        })
      )
      dispatch(
        setCurrentNode({
          node: {id: node.id, ctype: "folder", breadcrumb: null},
          panel: "secondary"
        })
      )
    } else if (mode == "main" && node.ctype == "folder") {
      navigate(`/folder/${node.id}?page_size=${lastPageSize}`)
    }

    if (mode == "main" && node.ctype == "document") {
      navigate(`/document/${node.id}`)
    } else if (mode == "secondary" && node.ctype == "document") {
      dispatch(
        fetchPaginatedDocument({
          nodeId: node.id,
          panel: "secondary",
          urlParams: new URLSearchParams(`page_size=${lastPageSize}`)
        })
      )
    }
  }

  const onPageNumberChange = (page: number) => {
    dispatch(
      fetchPaginatedNodes({
        nodeId: currentNodeID!,
        panel: mode,
        urlParams: new URLSearchParams(
          `page_number=${page}&page_size=${pageSize}`
        )
      })
    )
  }

  const onPageSizeChange = (value: string | null) => {
    if (value) {
      dispatch(
        fetchPaginatedNodes({
          nodeId: currentNodeID!,
          panel: mode,
          urlParams: new URLSearchParams(
            `page_number=${pageNumber}&page_size=${value}`
          )
        })
      )
    }
  }
  const onDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setDragOver(true)
  }

  const onDragEnter = () => {
    setDragOver(true)
  }

  const onDragLeave = () => {
    setDragOver(false)
  }

  const onDrop = (event: React.DragEvent<HTMLDivElement>) => {
    setDragOver(false)
    event.preventDefault()
    drop_files({
      source_files: event.dataTransfer.files,
      target: currentFolder!
    }).then(() => {})
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
    <Box
      onDragEnter={onDragEnter}
      onDragLeave={onDragLeave}
      onDragOver={onDragOver}
      onDrop={onDrop}
      className={dragOver ? classes.accept_files : classes.commander}
    >
      <FolderNodeActions />
      <Breadcrumbs onClick={onClick} />
      <Stack
        className={classes.content}
        justify={"space-between"}
        style={{height: `${height}px`}}
      >
        {commanderContent}
      </Stack>
    </Box>
  )
}
