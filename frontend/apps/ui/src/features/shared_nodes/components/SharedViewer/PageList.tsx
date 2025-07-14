import {useAppDispatch, useAppSelector} from "@/app/hooks"
import PanelContext from "@/contexts/PanelContext"
import {selectDocVerPaginationPageNumber} from "@/features/document/store/documentVersSlice"
import {selectIsGeneratingPreviews} from "@/features/document/store/imageObjectsSlice"

import Zoom from "@/components/document/Zoom"
import {generateNextPreviews} from "@/features/document/actions"
import Page from "@/features/document/components/Page"
import usePageList from "@/features/document/components/PageList/usePageList"
import {DOC_VER_PAGINATION_PAGE_BATCH_SIZE} from "@/features/document/constants"
import useAreAllPreviewsAvailable from "@/features/document/hooks/useAreAllPreviewsAvailable"
import useCurrentSharedDocVer from "@/features/shared_nodes/hooks/useCurrentSharedDocVer"
import {selectZoomFactor} from "@/features/ui/uiSlice"
import type {PanelMode} from "@/types"
import {useContext, useEffect, useRef} from "react"
import {PageList} from "viewer"

export default function PageListContainer() {
  const {docVer} = useCurrentSharedDocVer()
  const dispatch = useAppDispatch()
  const mode: PanelMode = useContext(PanelContext)
  const zoomFactor = useAppSelector(s => selectZoomFactor(s, mode))
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
