import {Loader, Stack} from "@mantine/core"

import {useAppSelector} from "@/app/hooks"
import PanelContext from "@/contexts/PanelContext"
import {selectThumbnailsPanelOpen} from "@/features/ui/uiSlice"
import {useContext, useMemo} from "react"
import {useSelector} from "react-redux"

import {selectCurrentDocumentVersionNumber} from "@/features/document/selectors"

import {useGetDocumentQuery} from "@/features/document/apiSlice"

import {RootState} from "@/app/types"
import {selectCurrentNodeID} from "@/features/ui/uiSlice"
import type {PanelMode} from "@/types"
import Thumbnail from "../Thumbnail"
import classes from "./Thumbnails.module.css"

export default function Thumbnails() {
  const mode: PanelMode = useContext(PanelContext)
  const currentNodeID = useAppSelector(s => selectCurrentNodeID(s, mode))
  const {data: doc, isLoading} = useGetDocumentQuery(currentNodeID!)
  const currDocumentVersionNumber = useAppSelector(s =>
    selectCurrentDocumentVersionNumber(s, mode)
  )
  const thumbnailsIsOpen = useSelector((state: RootState) =>
    selectThumbnailsPanelOpen(state, mode)
  )
  const docVersion = useMemo(() => {
    if (!doc) {
      return null
    }
    let maxVerNum = currDocumentVersionNumber

    if (!maxVerNum) {
      maxVerNum = Math.max(...doc.versions.map(v => v.number))
    }

    return doc.versions.find(v => v.number == maxVerNum)
  }, [doc, currDocumentVersionNumber])

  if (isLoading) {
    return <Loader />
  }

  const thumbnails = docVersion?.pages.map(p => (
    <Thumbnail key={p.id} page={{page: p, angle: 0}} />
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
