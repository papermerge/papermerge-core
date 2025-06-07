import { Loader, Stack } from "@mantine/core"

import { useAppSelector } from "@/app/hooks"
import { RootState } from "@/app/types"
import PanelContext from "@/contexts/PanelContext"
import { useGetDocLastVersionPaginatedQuery } from "@/features/document/apiSlice"
import {
  selectCurrentNodeCType, selectCurrentNodeID,
  selectThumbnailsPanelOpen
} from "@/features/ui/uiSlice"
import type { PanelMode } from "@/types"
import { skipToken } from "@reduxjs/toolkit/query"
import { useContext } from "react"
import { useSelector } from "react-redux"
import Thumbnail from "../Thumbnail"
import classes from "./Thumbnails.module.css"

interface Args {
  isFetching: boolean
}

export default function Thumbnails({isFetching}: Args) {
  const mode: PanelMode = useContext(PanelContext)
  const currentNodeID = useAppSelector(s => selectCurrentNodeID(s, mode))
  const currentCType = useAppSelector(s => selectCurrentNodeCType(s, mode))
  const getDocID = () => {
    if (!currentNodeID) {
      return null
    }

    if (!currentCType) {
      return null
    }

    if (currentCType != "document") {
      return null
    }

    // i.e. documentID = non empty node ID of ctype 'document'
    return currentNodeID
  }
  const docID = getDocID()

  const thumbnailsIsOpen = useSelector((state: RootState) =>
    selectThumbnailsPanelOpen(state, mode)
  )
  const {data} = useGetDocLastVersionPaginatedQuery(docID ? {
    doc_id: docID,
    page_number: 1,
    page_size: 5
  } : skipToken)
  //const pages = useAppSelector(s => selectCurrentPages(s, currDocVerID!))
  const thumbnails = data ? data.pages.map(p => <Thumbnail key={p.id} page_id={p.id} page_number={p.number} />) : []
  // display: none
  if (thumbnailsIsOpen) {
    if (isFetching) {
      return (
        <Stack className={classes.loader} justify="center" align="center">
          <Loader type="bars" color="white" />
        </Stack>
      )
    }
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
