import {Loader, Stack} from "@mantine/core"
import {forwardRef} from "react"
import classes from "./PageList.module.css"

interface Args {
  pageItems: Array<React.ReactNode>
  pagesAreLoading: boolean
  zoom: React.ReactNode
}

export const PageList = forwardRef<HTMLDivElement, Args>(
  ({zoom, pageItems, pagesAreLoading}, ref) => {
    return (
      <Stack
        ref={ref}
        justify="center"
        className={`${classes.pages} page-list`}
      >
        {pageItems}
        {zoom}
        {pagesAreLoading && (
          <Loader className={classes.pageListLoader} type="oval" />
        )}
      </Stack>
    )
  }
)

PageList.displayName = "PageList"

export default PageList
