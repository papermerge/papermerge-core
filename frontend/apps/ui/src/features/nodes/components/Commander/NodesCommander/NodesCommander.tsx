import {apiSlice} from "@/features/api/slice"
import {uploadFile} from "@/features/files/storage/thunks"
import type {UploadFileOutput} from "@/features/files/types"
import {setPanelComponent} from "@/features/ui/panelRegistry"
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
import Pagination from "@/components/Pagination"
import PanelContext from "@/contexts/PanelContext"
import {
  useGetFolderQuery,
  useGetPaginatedNodesQuery
} from "@/features/nodes/storage/api"
import {generateThumbnail} from "@/features/nodes/storage/thumbnailObjectsSlice"
import {selectMyPreferences} from "@/features/preferences/storage/preference"
import {
  commanderLastPageSizeUpdated,
  currentDocVerUpdated,
  selectCommanderSortMenuColumn,
  selectCommanderSortMenuDir,
  selectDraggedNodes,
  selectDraggedNodesSourceFolderID,
  selectDraggedPages,
  selectLastPageSize
} from "@/features/ui/uiSlice"
import type {NType, PanelMode} from "@/types"
import classes from "./Commander.module.scss"

import {
  APP_THUMBNAIL_KEY,
  APP_THUMBNAIL_VALUE
} from "@/features/document/constants"
import {APP_NODE_KEY, APP_NODE_VALUE} from "@/features/nodes/constants"
import {useTranslation} from "react-i18next"
import DraggingIcon from "./DraggingIcon"
import DropNodesModal from "./DropNodesDialog"
import ExtractPagesModal from "./ExtractPagesModal"
import FolderNodeActions from "./FolderNodeActions"
import NodesList from "./NodesList"
import SupportedFilesInfoModal from "./SupportedFilesInfoModal"

export default function Commander() {
  const {t} = useTranslation()
  const userPreferences = useAppSelector(selectMyPreferences)
  const [
    supportedFilesInfoOpened,
    {open: supportedFilesInfoOpen, close: supportedFilesInfoClose}
  ] = useDisclosure(false)
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
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const lastPageSize = useAppSelector(s => selectLastPageSize(s, mode))
  const currentNodeID = useAppSelector(s => selectCurrentNodeID(s, mode))
  const draggedPages = useAppSelector(selectDraggedPages)
  const draggedNodes = useAppSelector(selectDraggedNodes)
  const draggedNodesSourceFolderID = useAppSelector(
    selectDraggedNodesSourceFolderID
  )
  // needed to invalidate document tag
  const draggedPagesDocID = useAppSelector(selectDraggedPagesDocID)
  // needed to invalidate document's parent node tag
  const draggedPagesDocParentID = useAppSelector(selectDraggedPagesDocParentID)
  const [pageSize, setPageSize] = useState<number>(lastPageSize)
  const [page, setPage] = useState<number>(1)
  const filter = useAppSelector(s => selectFilterText(s, mode))
  const sortDir = useAppSelector(s => selectCommanderSortMenuDir(s, mode))
  const sortColumn = useAppSelector(s => selectCommanderSortMenuColumn(s, mode))

  const {data, isLoading, isFetching, isError, refetch, error} =
    useGetPaginatedNodesQuery({
      nodeID: currentNodeID!,
      page_number: page,
      page_size: pageSize,
      filter: filter,
      sortDir: sortDir,
      sortColumn: sortColumn
    })
  const [uploadFiles, setUploadFiles] = useState<File[] | FileList>()

  if (!currentNodeID) {
    return <div>Loading...</div>
  }

  const {data: currentFolder} = useGetFolderQuery(currentNodeID)

  if (isLoading && !data) {
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
    if (mode == "secondary") {
      dispatch(
        setPanelComponent({
          panelId: "secondary",
          component: node.ctype == "folder" ? "commander" : "viewer"
        })
      )
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
              target_id: currentNodeID
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

  let commanderContent

  if (data.items.length > 0) {
    commanderContent = (
      <>
        <Group>
          <NodesList
            items={data.items}
            onClick={onClick}
            onNodeDrag={onNodeDrag}
            onNodeDragStart={onNodeDragStart}
          />
        </Group>
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
    commanderContent = <Group>{t("common.empty")}</Group>
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
        <Stack className={classes.content} justify={"space-between"}>
          {commanderContent}
        </Stack>
      </Box>
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
