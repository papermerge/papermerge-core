import {useContext, useRef, useState, useEffect} from "react"
import {useDispatch, useSelector} from "react-redux"
import {Stack, Checkbox} from "@mantine/core"
import PanelContext from "@/contexts/PanelContext"

import {useProtectedJpg} from "@/hooks/protected_image"
import {
  setCurrentPage,
  dropThumbnailPage,
  selectionAddPage,
  selectionRemovePage,
  selectSelectedPageIds,
  selectSelectedPages
} from "@/slices/dualPanel/dualPanel"
import {
  dragPagesStart,
  dragPagesEnd,
  selectDraggedPages
} from "@/slices/dragndrop"
import type {PanelMode, PageType, DroppedThumbnailPosition} from "@/types"

import classes from "./Thumbnail.module.scss"
import {RootState} from "@/app/types"

const BORDERLINE_TOP = "borderline-top"
const BORDERLINE_BOTTOM = "borderline-bottom"
const DRAGGED = "dragged"

type Args = {
  page: PageType
}

export default function Thumbnail({page}: Args) {
  const dispatch = useDispatch()
  const protectedImage = useProtectedJpg(page.jpg_url)
  const mode: PanelMode = useContext(PanelContext)
  const selectedIds = useSelector((state: RootState) =>
    selectSelectedPageIds(state, mode)
  )
  const selectedPages = useSelector((state: RootState) =>
    selectSelectedPages(state, mode)
  )
  const ref = useRef<HTMLDivElement>(null)
  const [cssClassNames, setCssClassNames] = useState<Array<string>>([])
  const draggedPages = useSelector((state: RootState) =>
    selectDraggedPages(state)
  )

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
    dispatch(dragPagesStart([page, ...selectedPages]))
  }

  const onDragEnd = () => {
    //dispatch(dragPagesEnd())
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
        dropThumbnailPage({
          mode: mode,
          sources: draggedPages,
          target: page,
          position: position
        })
      )
      dispatch(dragPagesEnd())
    } // if (ref?.current)

    // remove both borderline_bottom and borderline_top
    const new_array = cssClassNames.filter(
      i => i != BORDERLINE_BOTTOM && i != BORDERLINE_TOP
    )
    setCssClassNames(new_array)
  }

  const onCheck = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.currentTarget.checked) {
      dispatch(selectionAddPage({selectionId: page.id, mode}))
    } else {
      dispatch(selectionRemovePage({selectionId: page.id, mode}))
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
        checked={selectedIds && selectedIds.includes(page.id)}
        className={classes.checkbox}
      />
      <img onClick={onClick} src={protectedImage.data || ""} />
      {page.number}
    </Stack>
  )
}
