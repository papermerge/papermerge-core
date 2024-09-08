import {Stack, Loader} from "@mantine/core"

import {useAppSelector} from "@/app/hooks"
import {useSelector} from "react-redux"
import {useContext} from "react"
import PanelContext from "@/contexts/PanelContext"
import {selectThumbnailsPanelOpen} from "@/slices/dualPanel/dualPanel"

import {selectDocumentCurrentVersion} from "@/features/document/selectors"

import {useGetDocumentQuery} from "@/features/document/apiSlice"

import type {PanelMode} from "@/types"
import {RootState} from "@/app/types"
import Thumbnail from "../Thumbnail"
import classes from "./Thumbnails.module.css"
import {selectCurrentNodeID} from "@/features/ui/uiSlice"

export default function Thumbnails() {
  const mode: PanelMode = useContext(PanelContext)
  const currentNodeID = useAppSelector(s => selectCurrentNodeID(s, mode))

  if (!currentNodeID) {
    return <Loader />
  }

  const {data, isLoading, isSuccess} = useGetDocumentQuery(currentNodeID)

  if (isLoading) {
    return <Loader />
  }

  const docVersion = useAppSelector(s =>
    selectDocumentCurrentVersion(s, mode, currentNodeID)
  )

  debugger

  const thumbnailsIsOpen = useSelector((state: RootState) =>
    selectThumbnailsPanelOpen(state, mode)
  )

  const thumbnails = docVersion?.pages.map(p => (
    <Thumbnail key={p.page.id} page={p} />
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
