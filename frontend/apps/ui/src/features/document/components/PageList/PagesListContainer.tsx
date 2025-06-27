import {useAppDispatch, useAppSelector} from "@/app/hooks"
import Zoom from "@/components/document/Zoom"
import PanelContext from "@/contexts/PanelContext"
import {DOC_VER_PAGINATION_PAGE_BATCH_SIZE} from "@/features/document/constants"
import {
  docVerPaginationUpdated,
  selectDocVerPaginationPageNumber
} from "@/features/document/documentVersSlice"
import {generatePreviews} from "@/features/document/imageObjectsSlice"
import {Loader} from "@mantine/core"

import {DocumentVersion} from "@/features/document/types"
import {selectZoomFactor} from "@/features/ui/uiSlice"
import type {PanelMode} from "@/types"
import {Stack} from "@mantine/core"
import {useContext, useEffect, useRef} from "react"
import {useTranslation} from "react-i18next"
import Page from "../Page"
import classes from "./PageList.module.css"
import usePageList from "./usePageList"

interface Args {
  docVer: DocumentVersion
}

export default function PageListContainer({docVer}: Args) {
  const {t} = useTranslation()
  const dispatch = useAppDispatch()
  const mode: PanelMode = useContext(PanelContext)
  const zoomFactor = useAppSelector(s => selectZoomFactor(s, mode))
  const pageNumber = useAppSelector(s =>
    selectDocVerPaginationPageNumber(s, docVer.id)
  )
  const containerRef = useRef<HTMLDivElement>(null)
  const {pages, isLoading, loadMore, markLoadingDone, markLoadingStart} =
    usePageList({
      docVerID: docVer.id,
      totalCount: docVer.pages.length,
      pageNumber: pageNumber,
      pageSize: DOC_VER_PAGINATION_PAGE_BATCH_SIZE,
      containerRef: containerRef
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
    if (loadMore && !isLoading) {
      markLoadingStart()
      console.log(`trigger load for pageNumber ${pageNumber + 1}`)
      dispatch(
        generatePreviews({
          docVer,
          size: "md",
          pageSize: DOC_VER_PAGINATION_PAGE_BATCH_SIZE,
          pageNumber,
          pageTotal: docVer.pages.length
        })
      ).then(markLoadingDone)
      dispatch(
        docVerPaginationUpdated({
          pageNumber: pageNumber + 1,
          pageSize: DOC_VER_PAGINATION_PAGE_BATCH_SIZE,
          docVerID: docVer.id
        })
      )
    }
  }, [isLoading, loadMore])

  return (
    <Stack ref={containerRef} justify="center" className={classes.pages}>
      {pageComponents}
      {isLoading && <Loader c="white" type="bars" />}
      <Zoom />
    </Stack>
  )
}
