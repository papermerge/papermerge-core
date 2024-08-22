import {useContext, useRef, useEffect, useState} from "react"
import {useDispatch} from "react-redux"
import {Stack, Checkbox} from "@mantine/core"
import PanelContext from "@/contexts/PanelContext"

import {useProtectedJpg} from "@/hooks/protected_image"
import {setCurrentPage} from "@/slices/dualPanel/dualPanel"
import type {PanelMode, PageType} from "@/types"

import classes from "./Thumbnail.module.scss"

const BORDERLINE_TOP = "borderline-top"
const BORDERLINE_BOTTOM = "borderline-bottom"

type Args = {
  page: PageType
}

export default function Thumbnail({page}: Args) {
  const dispatch = useDispatch()
  const protectedImage = useProtectedJpg(page.jpg_url)
  const mode: PanelMode = useContext(PanelContext)
  const ref = useRef<HTMLDivElement>(null)
  const [cssClassNames, setCssClassNames] = useState<Array<string>>([])

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

  return (
    <Stack
      ref={ref}
      className={`${classes.thumbnail} ${cssClassNames.join(" ")}`}
      align="center"
      gap={"xs"}
      onClick={onClick}
      draggable
      onDragOver={onLocalDragOver}
      onDragLeave={onLocalDragLeave}
      onDragEnter={onLocalDragEnter}
    >
      <Checkbox className={classes.checkbox} />
      <img src={protectedImage.data || ""} />
      {page.number}
    </Stack>
  )
}
