import {Box, Group, Stack} from "@mantine/core"
import {useDisclosure} from "@mantine/hooks"
import {useContext, useState} from "react"
import {createRoot} from "react-dom/client"

import {useAppDispatch, useAppSelector} from "@/app/hooks"
import {useNavigate} from "react-router-dom"

import {
  currentNodeChanged,
  selectCurrentNodeID,
  selectDraggedPagesDocID,
  selectDraggedPagesDocParentID,
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
  selectDraggedNodes,
  selectDraggedPages,
  selectLastPageSize
} from "@/features/ui/uiSlice"
import type {NType, NodeType, PanelMode} from "@/types"
import classes from "./Commander.module.scss"

import DraggingIcon from "./DraggingIcon"
import {DropFilesModal} from "./DropFiles"
import DropNodesModal from "./DropNodesDialog"
import ExtractPagesModal from "./ExtractPagesModal"
import FolderNodeActions from "./FolderNodeActions"
import Node from "./Node"

export default function Commander() {
  // dialog for dropped files from local file system (i.e. from outside of browser)
  const [dropFilesOpened, {open: dropFilesOpen, close: dropFilesClose}] =
    useDisclosure(false)
  // dialog for extracting document pages (i.e. doc -> commander)
  const [
    extractPagesOpened,
    {open: extractPagesOpen, close: extractPagesClose}
  ] = useDisclosure(false)
  // confirmation dialog when dropping nodes in commander
  const [dropNodesOpened, {open: dropNodesOpen, close: dropNodesClose}] =
    useDisclosure(false)
  const [dragOver, setDragOver] = useState<boolean>(false)
  const mode: PanelMode = useContext(PanelContext)
  const height = useAppSelector(s => selectContentHeight(s, mode))
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const lastPageSize = useAppSelector(s => selectLastPageSize(s, mode))
  const currentNodeID = useAppSelector(s => selectCurrentNodeID(s, mode))
  const draggedPages = useAppSelector(selectDraggedPages)
  const draggedNodes = useAppSelector(selectDraggedNodes)
  // needed to invalidate document tag
  const draggedPagesDocID = useAppSelector(selectDraggedPagesDocID)
  // needed to invalidate document's parent node tag
  const draggedPagesDocParentID = useAppSelector(selectDraggedPagesDocParentID)
  const [pageSize, setPageSize] = useState<number>(lastPageSize)
  const [page, setPage] = useState<number>(1)
  const filter = useAppSelector(s => selectFilterText(s, mode))
  const {data, isLoading, isFetching, isError, refetch} =
    useGetPaginatedNodesQuery({
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
    event.preventDefault()
    // #1 drop files from local FS into the commander
    if (event.dataTransfer.files.length > 0) {
      // workaround for weird bug BEGIN
      if (
        event.dataTransfer.files.length === 1 &&
        event.dataTransfer.files[0].name === "download.jpg"
      ) {
        // bug bug
        // really weird one - for some unknown to me reason, event.dataTransfer.files
        // has one entry with (seems to me) completely unrelated file
        // named 'download.jpg'.
        // I was able to reproduce this behavior
        // only in Google Chrome 117.0. For time being let just console
        // message log that it.
        // For this weird "file" we of course skip "drop_files" operation
        console.log("Where is this weird download.jpg is coming from ?")
        // workaround for weird bug END
      } else if (event.dataTransfer.files.length > 0) {
        // files dropped from local FS
        setDragOver(false)
        setUploadFiles(event.dataTransfer.files)
        dropFilesOpen()
        return
      }
    }
    if (draggedPages && draggedPages?.length > 0) {
      extractPagesOpen()
      setDragOver(false)
      return
    }
    if (draggedNodes && draggedNodes?.length > 0) {
      dropNodesOpen()
      setDragOver(false)
      return
    }
  }

  const onPagesExtracted = () => {
    extractPagesClose()
    // Fetch again (bypassing cache) nodes of current folder.
    // Current folder has now newly extracted docs.
    refetch()
  }

  const onNodeDrag = () => {}

  const onNodeDragStart = (nodeID: string, event: React.DragEvent) => {
    const image = <DraggingIcon nodeID={nodeID} />
    let ghost = document.createElement("div")
    ghost.style.transform = "translate(-10000px, -10000px)"
    ghost.style.position = "absolute"
    document.body.appendChild(ghost)
    event.dataTransfer.setDragImage(ghost, 0, -10)

    let root = createRoot(ghost)
    root.render(image)
  }

  const nodes = data.items.map((n: NodeType) => (
    <Node
      onClick={onClick}
      key={n.id}
      node={n}
      onDrag={onNodeDrag}
      onDragStart={onNodeDragStart}
    />
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
        <Breadcrumbs
          breadcrumb={currentFolder?.breadcrumb}
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
      {currentFolder && uploadFiles && uploadFiles.length > 0 && (
        <DropFilesModal
          opened={dropFilesOpened}
          source_files={uploadFiles}
          target={currentFolder}
          onSubmit={dropFilesClose}
          onCancel={dropFilesClose}
        />
      )}
      {draggedPagesDocParentID &&
        draggedPagesDocID &&
        currentFolder &&
        draggedPages &&
        draggedPages.length > 0 && (
          <ExtractPagesModal
            sourcePages={draggedPages}
            sourceDocID={draggedPagesDocID}
            sourceDocParentID={draggedPagesDocParentID}
            targetFolder={currentFolder}
            opened={extractPagesOpened}
            onSubmit={onPagesExtracted}
            onCancel={extractPagesClose}
          />
        )}
      {draggedNodes && currentFolder && draggedNodes.length > 0 && (
        <DropNodesModal
          sourceNodes={draggedNodes}
          targetFolder={currentFolder}
          opened={dropNodesOpened}
          onSubmit={dropNodesClose}
          onCancel={dropNodesClose}
        />
      )}
    </>
  )
}
