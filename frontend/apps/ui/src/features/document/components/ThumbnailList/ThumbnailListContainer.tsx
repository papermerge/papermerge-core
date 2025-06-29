import {useAppDispatch, useAppSelector} from "@/app/hooks"
import {generateNextPreviews} from "@/features/document/actions"
import {selectIsGeneratingPreviews} from "@/features/document/imageObjectsSlice"
import {Stack} from "@mantine/core"
import {useEffect, useRef} from "react"

import {RootState} from "@/app/types"
import {selectDocVerPaginationPageNumber} from "@/features/document/documentVersSlice"
import {DocumentVersion} from "@/features/document/types"
import {selectThumbnailsPanelOpen} from "@/features/ui/uiSlice"
import usePanelMode from "@/hooks/usePanelMode"
import {useSelector} from "react-redux"
import usePageList from "../PageList/usePageList"
import Thumbnail from "../Thumbnail"
import classes from "./ThumbnailListContainer.module.css"

interface Args {
  docVer: DocumentVersion
}

export default function ThumbnailListContainer({docVer}: Args) {
  const dispatch = useAppDispatch()
  const mode = usePanelMode()
  const pageNumber = useAppSelector(s =>
    selectDocVerPaginationPageNumber(s, docVer.id)
  )
  const containerRef = useRef<HTMLDivElement>(null)
  const {pages, loadMore} = usePageList({
    docVerID: docVer.id,
    totalCount: docVer.pages.length,
    size: "sm",
    cssSelector: ".thumbnail",
    containerRef: containerRef
  })
  const isGenerating = useAppSelector(s =>
    selectIsGeneratingPreviews(s, docVer.id, "sm")
  )
  const thumbnailComponents = pages.map(p => (
    <Thumbnail key={p.id} pageID={p.id} angle={p.angle} pageNumber={p.number} />
  ))
  const thumbnailsIsOpen = useSelector((state: RootState) =>
    selectThumbnailsPanelOpen(state, mode)
  )

  useEffect(() => {
    /*
    console.log(
      `pages.length=${pages.length} loadMore=${loadMore} isGenerating=${isGenerating}`
    )
    */
    if (pages.length == 0 && thumbnailsIsOpen && !isGenerating) {
      dispatch(generateNextPreviews({docVer, size: "sm", pageNumber: 1}))
    }
  }, [pages.length, thumbnailsIsOpen])

  useEffect(() => {
    console.log(
      `pages.length=${pages.length} loadMore=${loadMore} isGenerating=${isGenerating}`
    )
    if (loadMore && !isGenerating) {
      dispatch(
        generateNextPreviews({docVer, size: "sm", pageNumber: pageNumber + 1})
      )
    }
  }, [loadMore])

  // display: none
  if (thumbnailsIsOpen) {
    return (
      <Stack
        ref={containerRef}
        className={classes.thumbnails}
        justify="flex-start"
      >
        {thumbnailComponents}
      </Stack>
    )
  }

  return (
    <Stack
      style={{display: "none"}}
      className={classes.thumbnails}
      justify="flex-start"
    >
      {thumbnailComponents}
    </Stack>
  )
}
