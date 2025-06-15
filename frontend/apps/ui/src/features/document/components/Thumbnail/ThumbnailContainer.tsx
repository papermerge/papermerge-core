import {useAppDispatch, useAppSelector} from "@/app/hooks"

import {useGetDocumentQuery} from "@/features/document/apiSlice"
import {
  selectCurrentPages,
  selectDocVerClientPage,
  selectSelectedPages
} from "@/features/document/documentVersSlice"
import {
  dragEnded,
  dragPagesStarted,
  selectCurrentDocVerID,
  selectDraggedPagesDocID,
  selectDraggedPagesDocParentID,
  viewerCurrentPageUpdated
} from "@/features/ui/uiSlice"
import {useCurrentNode, usePanelMode} from "@/hooks"
import type {UUID} from "@/types.d/common"
import {useDisclosure} from "@mantine/hooks"
import {Thumbnail} from "@papermerge/viewer"
import {skipToken} from "@reduxjs/toolkit/query"

import {
  viewerSelectionPageAdded,
  viewerSelectionPageRemoved
} from "@/features/ui/uiSlice"
import type {DroppedThumbnailPosition} from "@/types"

import {contains_every} from "@/utils"
import TransferPagesModal from "../../../../components/document/TransferPagesModal"
import useThumbnail from "./useThumbnail"

/*
type Args = {
  page: ClientPage
}
*/

interface Args {
  pageNumber: number
  pageID: UUID
}

export default function ThumbnailContainer({pageNumber, pageID}: Args) {
  const dispatch = useAppDispatch()
  const mode = usePanelMode()
  const {currentNodeID} = useCurrentNode()

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

  const draggedPagesDocID = useAppSelector(selectDraggedPagesDocID)
  const draggedPagesDocParentID = useAppSelector(selectDraggedPagesDocParentID)

  const {currentData: doc} = useGetDocumentQuery(currentNodeID ?? skipToken)
  const docVerID = useAppSelector(s => selectCurrentDocVerID(s, mode))
  const docVerPages = useAppSelector(s => selectCurrentPages(s, docVerID!))
  const selectedPages = useAppSelector(s => selectSelectedPages(s, mode)) || []
  const page = useAppSelector(s =>
    selectDocVerClientPage(s, {docVerID, pageID})
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

  const onDragStart = () => {
    const data = {
      pages: [page, ...selectedPages],
      docID: doc!.id,
      docParentID: doc!.parent_id!
    }
    dispatch(dragPagesStarted(data))
  }

  const onDragEnd = () => {
    //dispatch(dragPagesEnded())
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
        /* Here we deal with page transfer is within the same document
        i.e we are just reordering. It is so because all source pages (their IDs)
        were found in the target document version.
        */
        /*
        dispatch(
          pagesDroppedInDoc({
            sources: draggedPages,
            target: page,
            targetDocVerID: docVerID!,
            position: position
          })
        )
         */
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
      dispatch(viewerSelectionPageAdded({itemID: pageID, mode}))
    } else {
      dispatch(viewerSelectionPageRemoved({itemID: pageID, mode}))
    }
  }

  return (
    <>
      <Thumbnail
        onChange={onCheck}
        checked={checked}
        pageNumber={pageNumber}
        angle={0}
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
