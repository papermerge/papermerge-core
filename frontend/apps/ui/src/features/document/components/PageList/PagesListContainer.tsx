import {useAppDispatch, useAppSelector} from "@/app/hooks"
import Zoom from "@/components/document/Zoom"
import PanelContext from "@/contexts/PanelContext"
import {DOC_VER_PAGINATION_PAGE_BATCH_SIZE} from "@/features/document/constants"
import {
  docVerPaginationUpdated,
  selectDocVerPaginationPageNumber
} from "@/features/document/documentVersSlice"
import {selectZoomFactor} from "@/features/ui/uiSlice"
import type {PanelMode} from "@/types"
import {UUID} from "@/types.d/common"
import {Button, Stack} from "@mantine/core"
import {useContext} from "react"
import {useTranslation} from "react-i18next"
import Page from "../Page"
import classes from "./PageList.module.css"
import usePageList from "./usePageList"

interface Args {
  docVerID: UUID
}

export default function PageListContainer({docVerID}: Args) {
  const {t} = useTranslation()
  const dispatch = useAppDispatch()
  const mode: PanelMode = useContext(PanelContext)
  const zoomFactor = useAppSelector(s => selectZoomFactor(s, mode))
  const pageNumber = useAppSelector(s =>
    selectDocVerPaginationPageNumber(s, docVerID)
  )
  const {pages, isLoading, showLoadMore} = usePageList({
    docVerID,
    totalCount: 5,
    pageNumber: pageNumber,
    pageSize: DOC_VER_PAGINATION_PAGE_BATCH_SIZE
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

  const onLoadMore = () => {
    if (docVerID) {
      dispatch(
        docVerPaginationUpdated({
          pageNumber: pageNumber + 1,
          pageSize: DOC_VER_PAGINATION_PAGE_BATCH_SIZE,
          docVerID: docVerID
        })
      )
    }
  }

  return (
    <Stack justify="center" className={classes.pages}>
      {pageComponents}
      {showLoadMore && (
        <Button size={"lg"} disabled={isLoading} onClick={onLoadMore}>
          {t("load-more")}
        </Button>
      )}
      <Zoom />
    </Stack>
  )
}
