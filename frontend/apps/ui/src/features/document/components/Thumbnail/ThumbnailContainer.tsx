import {useAppDispatch, useAppSelector} from "@/app/hooks"

import {
  APP_THUMBNAIL_KEY,
  APP_THUMBNAIL_VALUE
} from "@/features/document/constants"
import {
  useCurrentDoc,
  useCurrentDocVer,
  useSelectedPages
} from "@/features/document/hooks"
import {
  pagesDroppedInDoc,
  selectCurrentPages,
  selectDocVerClientPage
} from "@/features/document/store/documentVersSlice"
import {usePanel} from "@/features/ui/hooks/usePanel"
import {selectPanelSelectedIDs, setPanelList} from "@/features/ui/panelRegistry"
import {
  dragEnded,
  dragPagesStarted,
  selectDraggedPages,
  selectDraggedPagesDocID,
  selectDraggedPagesDocParentID,
  viewerCurrentPageUpdated
} from "@/features/ui/uiSlice"
import {usePanelMode} from "@/hooks"
import type {UUID} from "@/types.d/common"
import {useDisclosure} from "@mantine/hooks"
import {Thumbnail} from "viewer"

import type {DroppedThumbnailPosition} from "@/types"

import TransferPagesModal from "@/features/document/components/TransferPagesModal"
import {contains_every} from "@/utils"
import useThumbnail from "./useThumbnail"

interface Args {
  pageNumber: number
  angle: number
  pageID: UUID
}

export default function ThumbnailContainer({pageNumber, angle, pageID}: Args) {
  const dispatch = useAppDispatch()
  const mode = usePanelMode()
  const {panelId} = usePanel()
  const selectedPageIDs = useAppSelector(s =>
    selectPanelSelectedIDs(s, panelId)
  )
  const selectedPageIDSet = new Set(selectedPageIDs || [])

  const [
    trPagesDialogOpened,
    {open: trPagesDialogOpen, close: trPagesDialogClose}
  ] = useDisclosure(false)

  const {
    ref,
    imageURL,
    isLoading,
    checked,
    isDragged,
    withBorderBottom,
    withBorderTop,
    draggedPagesIDs,
    onDragOver,
    onDragLeave,
    clearBorderBottom,
    clearBorderTop
  } = useThumbnail(pageID)

  const draggedPages = useAppSelector(selectDraggedPages)
  const draggedPagesDocID = useAppSelector(selectDraggedPagesDocID)
  const draggedPagesDocParentID = useAppSelector(selectDraggedPagesDocParentID)

  const {doc} = useCurrentDoc()
  const {docVer} = useCurrentDocVer()
  const docVerPages = useAppSelector(s => selectCurrentPages(s, docVer?.id))
  const selectedPages = useSelectedPages({mode: panelId, docVerID: docVer?.id})
  const page = useAppSelector(s =>
    selectDocVerClientPage(s, {docVerID: docVer?.id, pageID})
  )

  const onClick = () => {
    dispatch(
      viewerCurrentPageUpdated({
        pageNumber: pageNumber,
        panel: mode
      })
    )
  }

  const onLocalDragEnter = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
  }

  const onDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    let pages

    if (page) {
      pages = [page, ...selectedPages]
    } else {
      pages = selectedPages
    }
    const data = {
      pages: pages,
      docID: doc!.id,
      docParentID: doc!.parent_id!
    }
    e.dataTransfer.setData(APP_THUMBNAIL_KEY, APP_THUMBNAIL_VALUE)
    dispatch(dragPagesStarted(data))
  }

  const onDragEnd = () => {
    //dispatch(dragEnded())
  }

  const onLocalDrop = (event: React.DragEvent<HTMLDivElement>) => {
    let position: DroppedThumbnailPosition = "before"
    const y = event.clientY

    if (!draggedPagesIDs) {
      console.warn("Dragged pages array is empty")
      return
    }

    event.preventDefault()

    if (ref?.current) {
      const rect = ref?.current.getBoundingClientRect()
      const half = (rect.bottom - rect.top) / 2

      if (y >= rect.top && y < rect.top + half) {
        // dropped over upper half of the page
        position = "before"
      } else if (y >= rect.top + half && y < rect.bottom) {
        // dropped over lower half of the page
        position = "after"
      }

      const page_ids = docVerPages.map(p => p.id)
      const source_ids = draggedPagesIDs
      if (contains_every({container: page_ids, items: source_ids})) {
        /* Here we deal with page transfer which is within the same document
        i.e we are just reordering. It is so because all source pages (their IDs)
        were found in the target document version.
        */
        if (draggedPages && page && docVer) {
          dispatch(
            pagesDroppedInDoc({
              sources: draggedPages,
              target: page,
              targetDocVerID: docVer.id,
              position: position
            })
          )
        }

        dispatch(dragEnded())
      } else {
        // here we deal with pages transfer between documents
        trPagesDialogOpen()
      }
    } // if (ref?.current)
    clearBorderBottom()
    clearBorderTop()
  }

  const onCheck = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.currentTarget.checked) {
      selectedPageIDSet.add(pageID)
    } else {
      selectedPageIDSet.delete(pageID)
    }
    const ids = Array.from(selectedPageIDSet)

    dispatch(setPanelList({panelId, list: {selectedIDs: ids}}))
  }

  return (
    <>
      <Thumbnail
        ref={ref}
        onChange={onCheck}
        checked={checked}
        pageNumber={pageNumber}
        angle={angle}
        imageURL={imageURL}
        isLoading={isLoading}
        withBorderBottom={withBorderBottom}
        withBorderTop={withBorderTop}
        isDragged={isDragged}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDragEnter={onLocalDragEnter}
        onDrop={onLocalDrop}
        onClick={onClick}
      />

      {draggedPagesDocParentID &&
        draggedPagesDocID &&
        draggedPagesIDs &&
        doc && (
          <TransferPagesModal
            targetDoc={doc}
            sourceDocID={draggedPagesDocID}
            sourceDocParentID={draggedPagesDocParentID}
            sourcePageIDs={draggedPagesIDs}
            targetPageID={pageID}
            opened={trPagesDialogOpened}
            onCancel={trPagesDialogClose}
            onSubmit={trPagesDialogClose}
          />
        )}
    </>
  )
}
