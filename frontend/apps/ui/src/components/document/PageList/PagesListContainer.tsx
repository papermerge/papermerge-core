import {useAppDispatch, useAppSelector} from "@/app/hooks"
import PanelContext from "@/contexts/PanelContext"
import {
  docVerPaginationUpdated,
  selectDocVerPaginationPageNumber
} from "@/features/document/documentVersSlice"
import {selectCurrentDocVerID} from "@/features/ui/uiSlice"
import type {PanelMode} from "@/types"
import {Button, Stack} from "@mantine/core"
import {useContext} from "react"
import {useTranslation} from "react-i18next"
import Page from "../Page"
import Zoom from "../Zoom"
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
    pageSize: 5
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
          pageSize: 5,
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
