import {useAppDispatch, useAppSelector} from "@/app/hooks"
import Zoom from "@/components/document/Zoom"
import PanelContext from "@/contexts/PanelContext"
import {selectDocVerPaginationPageNumber} from "@/features/document/documentVersSlice"
import {selectIsGeneratingPreviews} from "@/features/document/imageObjectsSlice"
import {Loader} from "@mantine/core"

import {DocumentVersion} from "@/features/document/types"
import {selectZoomFactor} from "@/features/ui/uiSlice"
import type {PanelMode} from "@/types"
import {Stack} from "@mantine/core"
import {useContext, useEffect, useRef} from "react"
import {useTranslation} from "react-i18next"
import {generateNextPreviews} from "../../actions"
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
  const isGenerating = useAppSelector(s =>
    selectIsGeneratingPreviews(s, docVer.id)
  )
  const {pages, loadMore} = usePageList({
    docVerID: docVer.id,
    totalCount: docVer.pages.length,
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
    if (loadMore && !isGenerating) {
      dispatch(generateNextPreviews({docVer, pageNumber: pageNumber + 1}))
    }
  }, [loadMore])

  return (
    <Stack ref={containerRef} justify="center" className={classes.pages}>
      {pageComponents}
      {isGenerating && <Loader c="white" type="bars" />}
      <Zoom />
    </Stack>
  )
}
