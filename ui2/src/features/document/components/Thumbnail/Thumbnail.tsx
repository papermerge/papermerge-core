import {useAppDispatch, useAppSelector} from "@/app/hooks"
import PanelContext from "@/contexts/PanelContext"
import {Checkbox, Stack} from "@mantine/core"
import {useContext, useEffect, useRef, useState} from "react"

import {useGetPageImageQuery} from "@/features/document/apiSlice"
import {
  pagesDroppedInDoc,
  selectSelectedPageIDs,
  selectSelectedPages
} from "@/features/document/documentVersSlice"
import {
  dragPagesEnded,
  dragPagesStarted,
  selectCurrentDocVerID,
  selectDraggedPages
} from "@/features/ui/uiSlice"
import {setCurrentPage} from "@/slices/dualPanel/dualPanel"
import type {ClientPage, DroppedThumbnailPosition, PanelMode} from "@/types"

import {
  viewerSelectionPageAdded,
  viewerSelectionPageRemoved
} from "@/features/ui/uiSlice"

import classes from "./Thumbnail.module.scss"

const BORDERLINE_TOP = "borderline-top"
const BORDERLINE_BOTTOM = "borderline-bottom"
const DRAGGED = "dragged"

type Args = {
  page: ClientPage
}

export default function Thumbnail({page}: Args) {
  const dispatch = useAppDispatch()
  const {data} = useGetPageImageQuery(page.id)
  const mode: PanelMode = useContext(PanelContext)
  const selectedIds = useAppSelector(s => selectSelectedPageIDs(s, mode))
  const selectedPages = useAppSelector(s => selectSelectedPages(s, mode))
  const ref = useRef<HTMLDivElement>(null)
  const [cssClassNames, setCssClassNames] = useState<Array<string>>([])
  const draggedPages = useAppSelector(selectDraggedPages)
  const docVerID = useAppSelector(s => selectCurrentDocVerID(s, mode))

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
    dispatch(setCurrentPage({mode, page: page.number}))
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
    dispatch(dragPagesStarted([page, ...selectedPages]))
  }

  const onDragEnd = () => {
    dispatch(dragPagesEnded())
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

      dispatch(
        pagesDroppedInDoc({
          sources: draggedPages,
          target: page,
          targetDocVerID: docVerID!,
          position: position
        })
      )
      dispatch(dragPagesEnded())
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

  return (
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
  )
}
