import {useAppDispatch, useAppSelector} from "@/app/hooks"
import PanelContext from "@/contexts/PanelContext"
import {DOC_VER_PAGINATION_PAGE_SIZE} from "@/features/document/constants"
import {
  docVerPaginationUpdated,
  selectDocVerPaginationPageNumber
} from "@/features/document/documentVersSlice"
import {selectCurrentDocVerID} from "@/features/ui/uiSlice"
import type {PanelMode} from "@/types"
import {Button, Stack} from "@mantine/core"
import {useContext} from "react"
import {useTranslation} from "react-i18next"
import Zoom from "../../../../components/document/Zoom"
import Page from "../Page"
import classes from "./PageList.module.css"
import usePageList from "./usePageList"

export default function PageListContainer() {
  const {t} = useTranslation()
  const dispatch = useAppDispatch()
  const mode: PanelMode = useContext(PanelContext)
  const docVerID = useAppSelector(s => selectCurrentDocVerID(s, mode))
  const pageNumber = useAppSelector(s =>
    selectDocVerPaginationPageNumber(s, docVerID)
  )
  const {pages, isLoading, showLoadMore} = usePageList({
    pageNumber: pageNumber,
    pageSize: DOC_VER_PAGINATION_PAGE_SIZE
  })
  const sortedPages = pages.sort((a, b) => a.pageNumber - b.pageNumber)
  const pageComponents = sortedPages.map(p => (
    <Page key={p.pageID} pageID={p.pageID} pageNumber={p.pageNumber} />
  ))

  const onLoadMore = () => {
    if (docVerID) {
      dispatch(
        docVerPaginationUpdated({
          pageNumber: pageNumber + 1,
          pageSize: DOC_VER_PAGINATION_PAGE_SIZE,
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
