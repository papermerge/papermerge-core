import {Loader, Stack} from "@mantine/core"

import Page from "../Page"
import Zoom from "../Zoom"
import classes from "./PageList.module.css"
import usePageList from "./usePageList"

export default function PageListContainer() {
  const {pageNumber, pageSize, pages, isLoading, isPolling} = usePageList()
  const pageComponents = pages.map(p => (
    <Page key={p.pageID} pageID={p.pageID} pageNumber={p.pageNumber} />
  ))

  if (isLoading) {
    return <Loader type="bars" />
  }

  return (
    <Stack justify="center" className={classes.pages}>
      {pageComponents}
      <Zoom />
    </Stack>
  )
}
