import {Stack} from "@mantine/core"

import {selectDocumentCurrentVersion} from "@/slices/dualPanel/dualPanel"
import {useSelector} from "react-redux"
import {useContext} from "react"
import PanelContext from "@/contexts/PanelContext"
import type {PanelMode} from "@/types"
import {RootState} from "@/app/types"
import Thumbnail from "./Thumbnail"
import ThumbnailsToggle from "./ThumbnailsToggle"
import classes from "./Thumbnails.module.css"

export default function Thumbnails() {
  const mode: PanelMode = useContext(PanelContext)
  const docVersion = useSelector((state: RootState) =>
    selectDocumentCurrentVersion(state, mode)
  )

  const thumbnails = docVersion?.pages.map(p => (
    <Thumbnail key={p.id} page={p} />
  ))

  return (
    <Stack className={classes.thumbnails} justify="flex-start">
      {thumbnails}
      <ThumbnailsToggle />
    </Stack>
  )
}
