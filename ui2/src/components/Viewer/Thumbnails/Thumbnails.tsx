import {Stack} from "@mantine/core"

import {useSelector} from "react-redux"
import {useContext} from "react"
import PanelContext from "@/contexts/PanelContext"
import {
  selectDocumentCurrentVersion,
  selectThumbnailsPanelOpen
} from "@/slices/dualPanel/dualPanel"
import type {PanelMode} from "@/types"
import {RootState} from "@/app/types"
import Thumbnail from "../Thumbnail"
import classes from "./Thumbnails.module.css"

export default function Thumbnails() {
  const mode: PanelMode = useContext(PanelContext)
  const docVersion = useSelector((state: RootState) =>
    selectDocumentCurrentVersion(state, mode)
  )
  const thumbnailsIsOpen = useSelector((state: RootState) =>
    selectThumbnailsPanelOpen(state, mode)
  )

  const thumbnails = docVersion?.pages.map(p => (
    <Thumbnail key={p.id} page={p} />
  ))
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
