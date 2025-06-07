import {Skeleton, Stack} from "@mantine/core"
import {forwardRef} from "react"
import classes from "./Page.module.css"

interface PageArgs {
  pageNumber: number
  imageURL: string | null | undefined
  isLoading: boolean
}

export const Page = forwardRef<HTMLImageElement, PageArgs>(
  ({pageNumber, imageURL, isLoading}, ref) => {
    if (isLoading) {
      return (
        <Stack className={classes.page}>
          <Skeleton height={800} />
          <div>{pageNumber}</div>
        </Stack>
      )
    }

    if (!imageURL) {
      return <Stack className={classes.page}>No Image URL</Stack>
    }

    return (
      <Stack className={classes.page}>
        <img
          /* style={{transform: `rotate(${page.angle}deg)`, width: `${zoomFactor}%`}} */
          ref={ref}
          src={imageURL}
        />
        <div>{pageNumber}</div>
      </Stack>
    )
  }
)

// Add a displayName to help with debugging in React DevTools
Page.displayName = "Page"

export default Page
