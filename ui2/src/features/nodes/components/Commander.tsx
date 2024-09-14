import {Box, Group, Stack} from "@mantine/core"
import {useDisclosure} from "@mantine/hooks"
import {useContext, useState} from "react"

import {useAppDispatch, useAppSelector} from "@/app/hooks"
import {useNavigate} from "react-router-dom"

import {
  currentNodeChanged,
  selectCurrentNodeID,
  selectFilterText
} from "@/features/ui/uiSlice"

import Breadcrumbs from "@/components/Breadcrumbs"
import Pagination from "@/components/Pagination"
import PanelContext from "@/contexts/PanelContext"
import {
  useGetFolderQuery,
  useGetPaginatedNodesQuery
} from "@/features/nodes/apiSlice"
import {
  commanderLastPageSizeUpdated,
  currentDocVerUpdated,
  selectContentHeight,
  selectLastPageSize
} from "@/features/ui/uiSlice"
import type {NType, NodeType, PanelMode} from "@/types"
import classes from "./Commander.module.scss"

import {DropFilesModal} from "./DropFiles"
import FolderNodeActions from "./FolderNodeActions"
import Node from "./Node"

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
        <Breadcrumbs breadcrumb={currentFolder?.breadcrumb} onClick={onClick} />
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
