import {Loader, Stack} from "@mantine/core"
import {forwardRef} from "react"
import classes from "./ThumbnailList.module.css"

interface Args {
  thumbnailItems: Array<React.ReactNode>
  paginationInProgress: boolean
  paginationFirstPageIsReady: boolean
}

export const ThumbnailList = forwardRef<HTMLDivElement, Args>(
  ({thumbnailItems, paginationInProgress, paginationFirstPageIsReady}, ref) => {
    if (!paginationFirstPageIsReady) {
      return (
        <div className={classes.thumbnailListContainer}>
          <Stack
            ref={ref}
            justify="center"
            className={`${classes.thumbnailList} thumbnail-list`}
          >
            <Loader className={classes.thumbnailListLoader} type="oval" />
          </Stack>
        </div>
      )
    }

    return (
      <div className={classes.thumbnailListContainer}>
        <Stack
          ref={ref}
          justify="center"
          className={`${classes.thumbnailList} thumbnail-list`}
        >
          {thumbnailItems}
          {paginationInProgress && (
            <Loader className={classes.thumbnailListLoader} type="oval" />
          )}
        </Stack>
      </div>
    )
  }
)

ThumbnailList.displayName = "ThumbnailList"

export default ThumbnailList
