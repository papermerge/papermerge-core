import {Stack} from "@mantine/core"

import Page from "../Page"
import Zoom from "../Zoom"
import classes from "./PageList.module.css"
import usePageList from "./usePageList"

export default function PageListContainer() {
  const {pageNumber, pageSize, pages} = usePageList()
  const pageComponents = pages.map(p => (
    <Page key={p.pageID} pageID={p.pageID} pageNumber={p.pageNumber} />
  ))

  return (
    <Stack justify="center" className={classes.pages}>
      {pageComponents}
      <Zoom />
    </Stack>
  )
}
