import {useAppDispatch, useAppSelector} from "@/app/hooks"
import {generateNextPreviews} from "@/features/document/actions"
import {selectIsGeneratingPreviews} from "@/features/document/imageObjectsSlice"
import {useEffect, useRef} from "react"

import {selectDocVerPaginationPageNumber} from "@/features/document/documentVersSlice"
import {DocumentVersion} from "@/features/document/types"
import {ThumbnailList} from "viewer"
import usePageList from "../PageList/usePageList"
import Thumbnail from "../Thumbnail"

interface Args {
  docVer: DocumentVersion
}

export default function ThumbnailListContainer({docVer}: Args) {
  const dispatch = useAppDispatch()
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

  useEffect(() => {
    /*
    console.log(
      `pages.length=${pages.length} loadMore=${loadMore} isGenerating=${isGenerating}`
    )
    */
    if (pages.length == 0 && !isGenerating) {
      dispatch(generateNextPreviews({docVer, size: "sm", pageNumber: 1}))
    }
  }, [pages.length])

  useEffect(() => {
    /*
    console.log(
      `pages.length=${pages.length} loadMore=${loadMore} isGenerating=${isGenerating}`
    )
    */
    if (loadMore && !isGenerating) {
      dispatch(
        generateNextPreviews({docVer, size: "sm", pageNumber: pageNumber + 1})
      )
    }
  }, [loadMore])

  return (
    <ThumbnailList
      ref={containerRef}
      thumbnailItems={thumbnailComponents}
      paginationInProgress={isGenerating}
      paginationFirstPageIsReady={pages.length > 0}
    />
  )
}
