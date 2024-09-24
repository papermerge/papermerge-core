import {useAppDispatch, useAppSelector} from "@/app/hooks"
import PanelContext from "@/contexts/PanelContext"
import {Checkbox, Skeleton, Stack} from "@mantine/core"
import {useDisclosure} from "@mantine/hooks"
import {useContext, useEffect, useRef, useState} from "react"

import {
  useGetDocumentQuery,
  useGetPageImageQuery
} from "@/features/document/apiSlice"
import {
  pagesDroppedInDoc,
  selectCurrentPages,
  selectSelectedPageIDs,
  selectSelectedPages
} from "@/features/document/documentVersSlice"
import {
  dragEnded,
  dragPagesStarted,
  selectCurrentDocVerID,
  selectCurrentNodeID,
  selectDraggedPages,
  selectDraggedPagesDocID,
  selectDraggedPagesDocParentID,
  viewerCurrentPageUpdated
} from "@/features/ui/uiSlice"

import {DRAGGED} from "@/cconstants"
import {
  viewerSelectionPageAdded,
  viewerSelectionPageRemoved
} from "@/features/ui/uiSlice"
import type {ClientPage, DroppedThumbnailPosition, PanelMode} from "@/types"

import {contains_every} from "@/utils"
import TransferPagesModal from "../TransferPagesModal"
import classes from "./Thumbnail.module.scss"

const BORDERLINE_TOP = "borderline-top"
const BORDERLINE_BOTTOM = "borderline-bottom"

type Args = {
  page: ClientPage
}

export default function Thumbnail({page}: Args) {
  const [
    trPagesDialogOpened,
    {open: trPagesDialogOpen, close: trPagesDialogClose}
  ] = useDisclosure(false)
  const dispatch = useAppDispatch()
  const {data, isFetching} = useGetPageImageQuery(page.id)
  const mode: PanelMode = useContext(PanelContext)
  const selectedIds = useAppSelector(s => selectSelectedPageIDs(s, mode))
  const selectedPages = useAppSelector(s => selectSelectedPages(s, mode)) || []
  const ref = useRef<HTMLDivElement>(null)
  const [cssClassNames, setCssClassNames] = useState<Array<string>>([])
  const draggedPages = useAppSelector(selectDraggedPages)
  const draggedPagesIDs = draggedPages?.map(p => p.id)
  const draggedPagesDocID = useAppSelector(selectDraggedPagesDocID)
  const draggedPagesDocParentID = useAppSelector(selectDraggedPagesDocParentID)
  const currentNodeID = useAppSelector(s => selectCurrentNodeID(s, mode))
  const {currentData: doc} = useGetDocumentQuery(currentNodeID!)
  const docVerID = useAppSelector(s => selectCurrentDocVerID(s, mode))
  const docVerPages = useAppSelector(s => selectCurrentPages(s, docVerID!))

  useEffect(() => {
    const cur_page_is_being_dragged = draggedPages?.find(p => p.id == page.id)
    if (cur_page_is_being_dragged) {
      if (cssClassNames.indexOf(DRAGGED) < 0) {
        setCssClassNames([...cssClassNames, DRAGGED])
      }
    } else {
      // i.e. is not dragged
      setCssClassNames(
        // remove css class
        cssClassNames.filter(item => item !== DRAGGED)
      )
    }
  }, [draggedPages?.length])

  const onClick = () => {
    dispatch(
      viewerCurrentPageUpdated({
        pageNumber: page.number,
        panel: mode
      })
    )
  }

  const onLocalDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    const y = event.clientY

    event.preventDefault()

    if (ref?.current) {
      const rect = ref?.current.getBoundingClientRect()
      const half = (rect.bottom - rect.top) / 2

      if (y >= rect.top && y < rect.top + half) {
        // remove borderline_bottom and add borderline_top
        const new_array = cssClassNames.filter(i => i != BORDERLINE_BOTTOM)

        if (new_array.indexOf(BORDERLINE_TOP) < 0) {
          setCssClassNames([...new_array, BORDERLINE_TOP])
        }
      } else if (y >= rect.top + half && y < rect.bottom) {
        // remove borderline_top and add borderline_bottom
        const new_array = cssClassNames.filter(i => i != BORDERLINE_TOP)

        if (new_array.indexOf(BORDERLINE_BOTTOM) < 0) {
          setCssClassNames([...new_array, BORDERLINE_BOTTOM])
        }
      }
    } // if (ref?.current)
  } // end of onLocalDragOver

  const onLocalDragLeave = () => {
    // remove both borderline_bottom and borderline_top
    const new_array = cssClassNames.filter(
      i => i != BORDERLINE_BOTTOM && i != BORDERLINE_TOP
    )
    setCssClassNames(new_array)
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

    if (!draggedPages) {
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
      const source_ids = draggedPages.map(p => p.id)
      if (contains_every({container: page_ids, items: source_ids})) {
        /* Here we deal with page transfer is within the same document
        i.e we are just reordering. It is so because all source pages (their IDs)
        were found in the target document version.
        */
        dispatch(
          pagesDroppedInDoc({
            sources: draggedPages,
            target: page,
            targetDocVerID: docVerID!,
            position: position
          })
        )
        dispatch(dragEnded())
      } else {
        // here we deal with pages transfer between documents
        trPagesDialogOpen()
      }
    } // if (ref?.current)

    // remove both borderline_bottom and borderline_top
    const new_array = cssClassNames.filter(
      i => i != BORDERLINE_BOTTOM && i != BORDERLINE_TOP
    )
    setCssClassNames(new_array)
  }

  const onCheck = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.currentTarget.checked) {
      dispatch(viewerSelectionPageAdded({itemID: page.id, mode}))
    } else {
      dispatch(viewerSelectionPageRemoved({itemID: page.id, mode}))
    }
  }

  if (isFetching) {
    return (
      <Stack justify="center" align="center">
        <Skeleton width={"100%"} height={160} />
        <div>{page.number}</div>
      </Stack>
    )
  }

  return (
    <>
      <Stack
        ref={ref}
        className={`${classes.thumbnail} ${cssClassNames.join(" ")}`}
        align="center"
        gap={"xs"}
        draggable
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        onDragOver={onLocalDragOver}
        onDragLeave={onLocalDragLeave}
        onDragEnter={onLocalDragEnter}
        onDrop={onLocalDrop}
      >
        <Checkbox
          onChange={onCheck}
          checked={selectedIds ? selectedIds.includes(page.id) : false}
          className={classes.checkbox}
        />
        <img
          style={{transform: `rotate(${page.angle}deg)`}}
          onClick={onClick}
          src={data}
        />
        {page.number}
      </Stack>
      {draggedPagesDocParentID &&
        draggedPagesDocID &&
        draggedPagesIDs &&
        doc && (
          <TransferPagesModal
            targetDoc={doc}
            sourceDocID={draggedPagesDocID}
            sourceDocParentID={draggedPagesDocParentID}
            sourcePageIDs={draggedPagesIDs}
            targetPageID={page.id}
            opened={trPagesDialogOpened}
            onCancel={trPagesDialogClose}
            onSubmit={trPagesDialogClose}
          />
        )}
    </>
  )
}
