import {useContext, useState} from "react"
import {Group, Stack, Box} from "@mantine/core"
import {useDisclosure} from "@mantine/hooks"

import {useAppSelector, useAppDispatch} from "@/app/hooks"
import {useNavigate} from "react-router-dom"

import {
  currentNodeChanged,
  selectCurrentNodeID,
  selectFilterText
} from "@/features/ui/uiSlice"

import type {NType, NodeType, PanelMode} from "@/types"
import Breadcrumbs from "@/components/Breadcrumbs"
import Pagination from "@/components/Pagination"
import PanelContext from "@/contexts/PanelContext"
import {
  selectContentHeight,
  selectLastPageSize,
  commanderLastPageSizeUpdated
} from "@/features/ui/uiSlice"
import classes from "./Commander.module.scss"
import {
  useGetFolderQuery,
  useGetPaginatedNodesQuery
} from "@/features/nodes/apiSlice"

import Node from "./Node"
import {DropFilesModal} from "./DropFiles"
import FolderNodeActions from "./FolderNodeActions"

export default function Commander() {
  const [opened, {open, close}] = useDisclosure(false)
  const [dragOver, setDragOver] = useState<boolean>(false)
  const mode: PanelMode = useContext(PanelContext)
  const height = useAppSelector(s => selectContentHeight(s, mode))
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const lastPageSize = useAppSelector(s => selectLastPageSize(s, mode))
  const currentNodeID = useAppSelector(s => selectCurrentNodeID(s, mode))
  const [pageSize, setPageSize] = useState<number>(lastPageSize)
  const [page, setPage] = useState<number>(1)
  const filter = useAppSelector(s => selectFilterText(s, mode))
  const {data, isLoading, isError} = useGetPaginatedNodesQuery({
    nodeID: currentNodeID!,
    page_number: page,
    page_size: pageSize,
    filter: filter
  })
  const [uploadFiles, setUploadFiles] = useState<File[] | FileList>()

  if (!currentNodeID) {
    return <div>Loading...</div>
  }

  const {data: currentFolder} = useGetFolderQuery(currentNodeID)

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
        currentNodeChanged({id: node.id, ctype: "folder", panel: "secondary"})
      )
    } else if (mode == "main" && node.ctype == "folder") {
      navigate(`/folder/${node.id}?page_size=${lastPageSize}`)
    }

    if (mode == "main" && node.ctype == "document") {
      navigate(`/document/${node.id}`)
    } else if (mode == "secondary" && node.ctype == "document") {
      /*
      dispatch(
        fetchPaginatedDocument({
          nodeId: node.id,
          panel: "secondary",
          urlParams: new URLSearchParams(`page_size=${lastPageSize}`)
        })
      )
        */
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
    setUploadFiles(event.dataTransfer.files)
    open()
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
      <DropFilesModal
        opened={opened}
        source_files={uploadFiles!}
        target={currentFolder!}
        onSubmit={close}
        onCancel={close}
      />
    </>
  )
}
