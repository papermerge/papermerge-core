import {apiSlice} from "@/features/api/slice"
import {uploadFile} from "@/features/files/storage/thunks"
import type {UploadFileOutput} from "@/features/files/types"
import useVisibleColumns from "@/features/nodes/hooks/useVisibleColumns"
import {updatePanelCurrentNode} from "@/features/ui/panelRegistry"
import {Box, Group, Stack} from "@mantine/core"
import {useDisclosure} from "@mantine/hooks"
import type {SortState} from "kommon"
import {DataTable, TablePagination} from "kommon"
import {useMemo, useState} from "react"
import {createRoot} from "react-dom/client"

import {useAppDispatch, useAppSelector} from "@/app/hooks"
import {useNavigate} from "react-router-dom"

import {
  selectCurrentNodeID,
  selectPanelSelectedIDs
} from "@/features/ui/panelRegistry"
import {
  selectDraggedPagesDocID,
  selectDraggedPagesDocParentID
} from "@/features/ui/uiSlice"

import {
  isHTTP403Forbidden,
  isHTTP404NotFound,
  isHTTP422UnprocessableContent
} from "@/services/helpers"

import {
  ERRORS_403_ACCESS_FORBIDDEN,
  ERRORS_404_RESOURCE_NOT_FOUND,
  ERRORS_422_UNPROCESSABLE_CONTENT
} from "@/cconstants"
import {isSupportedFile} from "@/features/nodes/utils"

import Breadcrumbs from "@/components/Breadcrumbs"
import {selectPanelAllCustom} from "@/features/ui/panelRegistry"

import {generateThumbnail} from "@/features/nodes/storage/thumbnailObjectsSlice"
import {selectMyPreferences} from "@/features/preferences/storage/preference"
import {
  selectDraggedNodes,
  selectDraggedNodesSourceFolderID,
  selectDraggedPages
} from "@/features/ui/uiSlice"
import type {NType, NodeType, Paginated, ViewOption} from "@/types"
import classes from "./Commander.module.css"
import nodeColumns from "./columns"

import {
  APP_THUMBNAIL_KEY,
  APP_THUMBNAIL_VALUE
} from "@/features/document/constants"
import {APP_NODE_KEY, APP_NODE_VALUE} from "@/features/nodes/constants"
import useNodes from "@/features/nodes/hooks/useNodes"

import {NodeQueryParams} from "@/features/nodes/types"
import {usePanel} from "@/features/ui/hooks/usePanel"
import {useTranslation} from "react-i18next"
import DraggingIcon from "./DraggingIcon"
import DropNodesModal from "./DropNodesDialog"
import ExtractPagesModal from "./ExtractPagesModal"
import FolderNodeActions from "./FolderNodeActions"
import NodesList from "./NodesList"
import SupportedFilesInfoModal from "./SupportedFilesInfoModal"

export default function Commander() {
  const {t} = useTranslation()
  const {panelId} = usePanel()
  const userPreferences = useAppSelector(selectMyPreferences)
  const [
    supportedFilesInfoOpened,
    {open: supportedFilesInfoOpen, close: supportedFilesInfoClose}
  ] = useDisclosure(false)
  // dialog for extracting document pages (i.e. doc -> commander)
  const [
    extractPagesOpened,
    {open: extractPagesOpen, close: extractPagesClose}
  ] = useDisclosure(false)
  // confirmation dialog when dropping nodes in commander
  const [dropNodesOpened, {open: dropNodesOpen, close: dropNodesClose}] =
    useDisclosure(false)
  const [dragOver, setDragOver] = useState<boolean>(false)

  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const selectedItemIDs = useAppSelector(s =>
    selectPanelSelectedIDs(s, panelId)
  )
  const selectedItemsSet = new Set(selectedItemIDs || [])

  const currentNodeID = useAppSelector(s => selectCurrentNodeID(s, panelId))
  const draggedPages = useAppSelector(selectDraggedPages)
  const draggedNodes = useAppSelector(selectDraggedNodes)
  const draggedNodesSourceFolderID = useAppSelector(
    selectDraggedNodesSourceFolderID
  )
  // needed to invalidate document tag
  const draggedPagesDocID = useAppSelector(selectDraggedPagesDocID)
  // needed to invalidate document's parent node tag
  const draggedPagesDocParentID = useAppSelector(selectDraggedPagesDocParentID)

  const {
    data,
    isLoading,
    isFetching,
    isError,
    refetch,
    error,
    actions,
    currentFolder,
    queryParams
  } = useNodes()

  const selectedNodes = useMemo(() => {
    if (!data?.items || !selectedItemIDs) {
      return []
    }
    return data.items.filter(node => selectedItemIDs.includes(node.id))
  }, [data?.items, selectedItemIDs])

  const [uploadFiles, setUploadFiles] = useState<File[] | FileList>()

  if (isLoading) {
    return <div>Loading...</div>
  }

  if (isError && isHTTP422UnprocessableContent(error)) {
    navigate(ERRORS_422_UNPROCESSABLE_CONTENT)
  }

  if (isError && isHTTP404NotFound(error)) {
    navigate(ERRORS_404_RESOURCE_NOT_FOUND)
  }

  if (isError && isHTTP403Forbidden(error)) {
    navigate(ERRORS_403_ACCESS_FORBIDDEN)
  }

  if (isError) {
    return <div>{`some error`}</div>
  }

  if (!data) {
    return <div>Data is null</div>
  }

  const onClick = (node: NType) => {
    actions.updateCurrentNode(node)
  }

  const handleSortChange = (value: SortState) => {
    actions.updateSorting(value)
  }

  const onPageNumberChange = (page: number) => {
    actions.updatePagination({
      pageNumber: page
    })
  }

  const onPageSizeChange = (value: number) => {
    if (value) {
      const pSize = value
      actions.updatePagination({
        pageNumber: 1,
        pageSize: pSize
      })
    }
  }

  const handleSelectionChange = (newSelection: Set<string>) => {
    const arr = Array.from(newSelection)
    actions.setSelection(arr)
  }

  const onTableRowClick = (row: NodeType, openInSecondaryPanel: boolean) => {
    const component = row.ctype === "document" ? "viewer" : "commander"

    // Secondary panel always uses dispatch
    if (openInSecondaryPanel || panelId == "secondary") {
      dispatch(
        updatePanelCurrentNode({
          panelID: "secondary",
          entityID: row.id,
          component
        })
      )
      return
    }

    // Main panel navigates
    const path = row.ctype === "folder" ? "folder" : "document"
    navigate(`/${path}/${row.id}`)
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

  const onDrop = async (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    const payloadThumbnailData = event.dataTransfer.getData(APP_THUMBNAIL_KEY)
    const payloadNodeData = event.dataTransfer.getData(APP_NODE_KEY)

    setDragOver(false)

    if (event.dataTransfer.files.length > 0) {
      /** (1)
       * Why dataTransfer.files.length > 0 When Dragging <img> From the App?
         When you drag an <img src="..."> element (even inside your own app),
         the browser (especially Chrome and Firefox) automatically attaches the image file to
         the DataTransfer object. This happens even if:
          * The <img> was never selected by the user from the file system.
          * The image is loaded from a remote URL or a data URL.
       */
      if (payloadThumbnailData == APP_THUMBNAIL_VALUE) {
        // ignore, as this is dragging thumbnails from docviewer
        // see (1)
      } else if (payloadNodeData == APP_NODE_VALUE) {
        // ignore, as this is dragging commander's node
        // see (1)
      } else {
        // files dropped from local FS
        const files = Array.from(event.dataTransfer.files)
        const validFiles = files.filter(isSupportedFile)

        if (validFiles.length === 0) {
          supportedFilesInfoOpen()
          return
        }

        for (let i = 0; i < validFiles.length; i++) {
          const result = await dispatch(
            uploadFile({
              file: validFiles[i],
              lang: userPreferences.uploaded_document_lang,
              ocr: false,
              target_id: currentNodeID!
            })
          )
          const newlyCreatedNode = result.payload as UploadFileOutput

          if (
            newlyCreatedNode &&
            newlyCreatedNode.node &&
            newlyCreatedNode.success
          ) {
            const newNodeID = newlyCreatedNode.node.id
            dispatch(
              generateThumbnail({node_id: newNodeID, file: validFiles[i]})
            )
          }
        }
        dispatch(apiSlice.util.invalidateTags(["Node"]))
        return
      }
    }
    if (draggedPages && draggedPages?.length > 0) {
      extractPagesOpen()

      return
    }
    if (draggedNodes && draggedNodes?.length > 0) {
      dropNodesOpen()
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
    event.dataTransfer.setData(APP_NODE_KEY, APP_NODE_VALUE)

    let root = createRoot(ghost)
    root.render(image)
  }

  return (
    <>
      <Stack
        style={{
          height: "100%"
        }}
        onDragEnter={onDragEnter}
        onDragLeave={onDragLeave}
        onDragOver={onDragOver}
        onDrop={onDrop}
        className={dragOver ? classes.accept_files : classes.commander}
      >
        <FolderNodeActions selectedNodes={selectedNodes} />
        <Breadcrumbs
          breadcrumb={currentFolder?.breadcrumb}
          onClick={onClick}
          isFetching={isFetching}
        />
        <DataItems
          data={data}
          onClick={onClick}
          handleSelectionChange={handleSelectionChange}
          handleSortChange={handleSortChange}
          onTableRowClick={onTableRowClick}
          queryParams={queryParams}
          selectedItemsSet={selectedItemsSet}
          onNodeDrag={onNodeDrag}
          onNodeDragStart={onNodeDragStart}
        />
        <TablePagination
          currentPage={data?.page_number || 1}
          totalPages={data?.num_pages || 0}
          pageSize={data?.page_size || 15}
          onPageChange={onPageNumberChange}
          onPageSizeChange={onPageSizeChange}
          totalItems={data?.total_items}
          t={t}
        />
      </Stack>
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
      {draggedNodes &&
        currentFolder &&
        draggedNodes.length > 0 &&
        draggedNodesSourceFolderID && (
          <DropNodesModal
            sourceNodes={draggedNodes}
            targetFolder={currentFolder}
            sourceFolderID={draggedNodesSourceFolderID}
            opened={dropNodesOpened}
            onSubmit={dropNodesClose}
            onCancel={dropNodesClose}
          />
        )}
      {supportedFilesInfoOpened && (
        <SupportedFilesInfoModal
          opened={supportedFilesInfoOpened}
          onClose={supportedFilesInfoClose}
        />
      )}
    </>
  )
}

interface DataItemsArgs {
  data: Paginated<NodeType>
  onClick: (node: NType) => void
  handleSelectionChange: (newSelection: Set<string>) => void
  handleSortChange: (value: SortState) => void
  selectedItemsSet: Set<string>
  onNodeDrag: () => void
  onNodeDragStart: (nodeID: string, event: React.DragEvent) => void
  onTableRowClick: (row: NodeType, openInSecondaryPanel: boolean) => void
  queryParams: NodeQueryParams
}

function DataItems({
  data,
  queryParams,
  onClick,
  handleSelectionChange,
  handleSortChange,
  selectedItemsSet,
  onNodeDrag,
  onNodeDragStart,
  onTableRowClick
}: DataItemsArgs) {
  const {t} = useTranslation()
  const {panelId} = usePanel()
  const {viewOption} = useAppSelector(s => selectPanelAllCustom(s, panelId))
  const viewOptionValue = viewOption as ViewOption
  const visibleColumns = useVisibleColumns(nodeColumns(t))
  const getRowId = (row: NodeType) => row.id

  if (data.items.length == 0) {
    return (
      <Group>{t?.("common.empty", {defaultValue: "No items found"})}</Group>
    )
  }

  if (viewOptionValue == "tile") {
    return (
      <Box
        style={{
          height: "100%",
          overflow: "auto",
          position: "relative"
        }}
      >
        <Group>
          <NodesList
            items={data.items}
            onClick={onClick}
            onSelectionChange={handleSelectionChange}
            selectedItems={selectedItemsSet}
            onNodeDrag={onNodeDrag}
            onNodeDragStart={onNodeDragStart}
          />
        </Group>
      </Box>
    )
  }

  return (
    <DataTable<NodeType>
      data={data?.items || []}
      columns={visibleColumns}
      sorting={{
        column: queryParams.sort_by,
        direction: queryParams.sort_direction || null
      }}
      selectedRows={selectedItemsSet}
      onSortChange={handleSortChange}
      onSelectionChange={handleSelectionChange}
      onRowClick={onTableRowClick}
      withCheckbox={true}
      withSecondaryPanelTriggerColumn={panelId == "main"}
      getRowId={getRowId}
    />
  )
}
