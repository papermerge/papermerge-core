import {useAppDispatch, useAppSelector} from "@/app/hooks"
import {generateNextPreviews} from "@/features/document/actions"
import {DOC_VER_PAGINATION_THUMBNAIL_BATCH_SIZE} from "@/features/document/constants"
import useAreAllPreviewsAvailable from "@/features/document/hooks/useAreAllPreviewsAvailable"
import useCurrentDocVer from "@/features/document/hooks/useCurrentDocVer"
import {selectDocVerPaginationThumnailPageNumber} from "@/features/document/store/documentVersSlice"
import {selectIsGeneratingPreviews} from "@/features/document/store/imageObjectsSlice"
import {ClientPage} from "@/types"
import {useEffect, useRef} from "react"
import {ThumbnailList} from "viewer"
import usePageList from "../PageList/usePageList"
import Thumbnail from "../Thumbnail"

export default function ThumbnailListContainer() {
  const {docVer} = useCurrentDocVer()
  const dispatch = useAppDispatch()
  const pageNumber = useAppSelector(s =>
    selectDocVerPaginationThumnailPageNumber(s, docVer?.id)
  )
  const containerRef = useRef<HTMLDivElement>(null)
  const {pages, loadMore, currentPageNumber} = usePageList({
    docVerID: docVer?.id,
    totalCount: docVer?.pages.length,
    size: "sm",
    cssSelector: ".thumbnail",
    containerRef: containerRef
  })
  const isGenerating = useAppSelector(s =>
    selectIsGeneratingPreviews(s, "sm", docVer?.id)
  )
  const allPreviewsAreAvailable = useAreAllPreviewsAvailable({
    docVer,
    pageSize: DOC_VER_PAGINATION_THUMBNAIL_BATCH_SIZE,
    pageNumber: pageNumber + 1,
    imageSize: "sm"
  })
  const thumbnailComponents = pages.map(p => (
    <Thumbnail key={p.id} pageID={p.id} angle={p.angle} pageNumber={p.number} />
  ))
  /* Addresses situation when user deletes N pages. In such case
  we want to avoid a hole (skipped) of N pages in next batch  */
  const thumbnailListPageCount = pageCount(pages)

  useEffect(() => {
    if (pages.length == 0 && !isGenerating) {
      dispatch(generateNextPreviews({docVer, size: "sm", pageNumber: 1}))
    }
  }, [pages.length])

  useEffect(() => {
    if (loadMore && !isGenerating) {
      if (!allPreviewsAreAvailable) {
        dispatch(
          generateNextPreviews({
            docVer,
            size: "sm",
            pageNumber: pageNumber + 1,
            thumbnailListPageCount
          })
        )
      }
    }
  }, [loadMore])

  console.log(`thumbnailListPageCount=${thumbnailListPageCount}`)
  return (
    <ThumbnailList
      ref={containerRef}
      thumbnailItems={thumbnailComponents}
      paginationInProgress={isGenerating}
      paginationFirstPageIsReady={pages.length > 0}
    />
  )
}

function pageCount(pages?: ClientPage[]): number | undefined {
  if (!pages) {
    return undefined
  }
  if (pages.length == 0) {
    return undefined
  }

  return pages.length
}
