import {useContext, useRef, useState, useEffect} from "react"
import {useDispatch, useSelector} from "react-redux"
import {Stack, Checkbox} from "@mantine/core"
import PanelContext from "@/contexts/PanelContext"

import {useProtectedJpg} from "@/hooks/protected_image"
import {setCurrentPage} from "@/slices/dualPanel/dualPanel"
import {
  dragPagesStart,
  dragPagesEnd,
  selectDraggedPages
} from "@/slices/dragndrop"
import type {PanelMode, PageType} from "@/types"

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
    dispatch(dragPagesStart([page]))
  }

  const onDragEnd = () => {
    dispatch(dragPagesEnd())
  }

  const onLocalDrop = () => {
    // remove both borderline_bottom and borderline_top
    const new_array = cssClassNames.filter(
      i => i != BORDERLINE_BOTTOM && i != BORDERLINE_TOP
    )
    setCssClassNames(new_array)
  }

  return (
    <Stack
      ref={ref}
      className={`${classes.thumbnail} ${cssClassNames.join(" ")}`}
      align="center"
      gap={"xs"}
      onClick={onClick}
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragOver={onLocalDragOver}
      onDragLeave={onLocalDragLeave}
      onDragEnter={onLocalDragEnter}
      onDrop={onLocalDrop}
    >
      <Checkbox className={classes.checkbox} />
      <img src={protectedImage.data || ""} />
      {page.number}
    </Stack>
  )
}
