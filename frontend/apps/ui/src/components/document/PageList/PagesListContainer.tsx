import {Button, Stack} from "@mantine/core"
import {useState} from "react"
import {useTranslation} from "react-i18next"

import Page from "../Page"
import Zoom from "../Zoom"
import classes from "./PageList.module.css"
import usePageList from "./usePageList"

export default function PageListContainer() {
  const {t} = useTranslation()
  const [pageNumber, setPageNumber] = useState<number>(1)
  const {pages, isLoading, showLoadMore} = usePageList({
    pageNumber: pageNumber,
    pageSize: 5
  })
  const sortedPages = pages.sort((a, b) => a.pageNumber - b.pageNumber)
  const pageComponents = sortedPages.map(p => (
    <Page key={p.pageID} pageID={p.pageID} pageNumber={p.pageNumber} />
  ))

  return (
    <Stack justify="center" className={classes.pages}>
      {pageComponents}
      {showLoadMore && (
        <Button
          size={"lg"}
          disabled={isLoading}
          onClick={() => setPageNumber(pageNumber + 1)}
        >
          {t("load-more")}
        </Button>
      )}
      <Zoom />
    </Stack>
  )
}
