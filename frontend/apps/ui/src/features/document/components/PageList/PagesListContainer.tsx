import {useAppDispatch, useAppSelector} from "@/app/hooks"
import PanelContext from "@/contexts/PanelContext"
import {selectDocVerPaginationPageNumber} from "@/features/document/documentVersSlice"
import {selectIsGeneratingPreviews} from "@/features/document/imageObjectsSlice"

import Zoom from "@/components/document/Zoom"
import {generateNextPreviews} from "@/features/document/actions"
import {DOC_VER_PAGINATION_PAGE_BATCH_SIZE} from "@/features/document/constants"
import useAreAllPreviewsAvailable from "@/features/document/hooks/useAreAllPreviewsAvailable"
import {DocumentVersion} from "@/features/document/types"
import {selectZoomFactor} from "@/features/ui/uiSlice"
import type {PanelMode} from "@/types"
import {useContext, useEffect, useRef} from "react"
import {PageList} from "viewer"
import Page from "../Page"
import usePageList from "./usePageList"

interface Args {
  docVer: DocumentVersion
}

export default function PageListContainer({docVer}: Args) {
  const dispatch = useAppDispatch()
  const mode: PanelMode = useContext(PanelContext)
  const zoomFactor = useAppSelector(s => selectZoomFactor(s, mode))
  const pageNumber = useAppSelector(s =>
    selectDocVerPaginationPageNumber(s, docVer.id)
  )
  const containerRef = useRef<HTMLDivElement>(null)
  const isGenerating = useAppSelector(s =>
    selectIsGeneratingPreviews(s, docVer.id, "md")
  )
  const {pages, loadMore} = usePageList({
    docVerID: docVer.id,
    totalCount: docVer.pages.length,
    cssSelector: ".page",
    containerRef: containerRef
  })
  const allPreviewsAreAvailable = useAreAllPreviewsAvailable({
    docVer,
    pageSize: DOC_VER_PAGINATION_PAGE_BATCH_SIZE,
    pageNumber
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
        dispatch(generateNextPreviews({docVer, pageNumber: pageNumber + 1}))
      }
    }
  }, [loadMore])

  return (
    <PageList
      ref={containerRef}
      pageItems={pageComponents}
      paginationInProgress={isGenerating}
      zoom={<Zoom />}
    />
  )
}
