import {useAppDispatch, useAppSelector} from "@/app/hooks"
import {selectDocVerPaginationPageNumber} from "@/features/document/store/documentVersSlice"
import {selectIsGeneratingPreviews} from "@/features/document/store/imageObjectsSlice"

import Zoom from "@/components/document/Zoom"
import {generateNextPreviews} from "@/features/document/actions"
import {DOC_VER_PAGINATION_PAGE_BATCH_SIZE} from "@/features/document/constants"
import useAreAllPreviewsAvailable from "@/features/document/hooks/useAreAllPreviewsAvailable"
import useCurrentDocVer from "@/features/document/hooks/useCurrentDocVer"
import {usePanel} from "@/features/ui/hooks/usePanel"
import {selectPanelAllCustom} from "@/features/ui/panelRegistry"
import {useEffect, useRef} from "react"
import {PageList} from "viewer"
import Page from "../Page"
import usePageList from "./usePageList"

interface Args {
  docVer: ReturnType<typeof useCurrentDocVer>["docVer"]
}

export default function PageListContainer({docVer}: Args) {
  const dispatch = useAppDispatch()

  const {panelId} = usePanel()
  const {zoomFactor} = useAppSelector(s => selectPanelAllCustom(s, panelId))

  const pageNumber = useAppSelector(s =>
    selectDocVerPaginationPageNumber(s, docVer?.id)
  )
  const containerRef = useRef<HTMLDivElement>(null)
  const isGenerating = useAppSelector(s =>
    selectIsGeneratingPreviews(s, "md", docVer?.id)
  )
  const {pages, loadMore, currentPageNumber} = usePageList({
    docVerID: docVer?.id,
    totalCount: docVer?.pages.length,
    cssSelector: ".page",
    containerRef: containerRef
  })
  const nextPageNumber = pageNumber + 1
  const allPreviewsAreAvailable = useAreAllPreviewsAvailable({
    docVer,
    pageSize: DOC_VER_PAGINATION_PAGE_BATCH_SIZE,
    pageNumber: nextPageNumber,
    imageSize: "md"
  })

  const pageComponents = pages.map(p => (
    <Page
      key={p.id}
      pageID={p.id}
      zoomFactor={zoomFactor}
      angle={p.angle}
      pageNumber={p.number}
    />
  ))

  useEffect(() => {
    if (loadMore && !isGenerating) {
      if (!allPreviewsAreAvailable) {
        dispatch(generateNextPreviews({docVer, pageNumber: nextPageNumber}))
      }
    }
  }, [
    loadMore,
    isGenerating,
    allPreviewsAreAvailable,
    pageNumber,
    docVer,
    dispatch
  ])

  return (
    <PageList
      ref={containerRef}
      pageItems={pageComponents}
      paginationInProgress={isGenerating}
      zoom={
        <Zoom
          pageNumber={currentPageNumber}
          pageTotal={docVer?.pages.length || 1}
        />
      }
    />
  )
}
