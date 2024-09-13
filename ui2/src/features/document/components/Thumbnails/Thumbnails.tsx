import {Stack} from "@mantine/core"

import {useAppSelector} from "@/app/hooks"
import PanelContext from "@/contexts/PanelContext"
import {
  selectCurrentDocVerID,
  selectThumbnailsPanelOpen
} from "@/features/ui/uiSlice"
import {useContext} from "react"
import {useSelector} from "react-redux"

import {RootState} from "@/app/types"
import {selectCurrentPages} from "@/features/document/documentVersSlice"
import type {PanelMode} from "@/types"
import Thumbnail from "../Thumbnail"
import classes from "./Thumbnails.module.css"

export default function Thumbnails() {
  const mode: PanelMode = useContext(PanelContext)
  const currDocVerID = useAppSelector(s => selectCurrentDocVerID(s, mode))
  const thumbnailsIsOpen = useSelector((state: RootState) =>
    selectThumbnailsPanelOpen(state, mode)
  )
  const pages = useAppSelector(s => selectCurrentPages(s, currDocVerID!))

  const thumbnails = pages.map(p => <Thumbnail key={p.id} page={p} />)
  // display: none
  if (thumbnailsIsOpen) {
    return (
      <Stack className={classes.thumbnails} justify="flex-start">
        {thumbnails}
      </Stack>
    )
  }

  return (
    <Stack
      style={{display: "none"}}
      className={classes.thumbnails}
      justify="flex-start"
    >
      {thumbnails}
    </Stack>
  )
}
