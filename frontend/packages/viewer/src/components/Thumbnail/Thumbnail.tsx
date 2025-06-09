import {Checkbox, Skeleton, Stack} from "@mantine/core"
import {forwardRef} from "react"
import classes from "./Thumbnail.module.css"

const DRAGGED = "dragged"
const BORDERLINE_TOP = "borderline-top"
const BORDERLINE_BOTTOM = "borderline-bottom"

interface ThumbnailArgs {
  pageNumber: number
  imageURL: string | null | undefined
  checked?: boolean
  isLoading?: boolean
  isDragged?: boolean
  withBorderTop?: boolean
  withBorderBottom?: boolean
  angle?: number
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
  onDragStart?: () => void
  onDragEnd?: () => void
  onDragOver?: (event: React.DragEvent<HTMLDivElement>) => void
  onDragLeave?: () => void
  onDragEnter?: (event: React.DragEvent<HTMLDivElement>) => void
  onDrop?: (event: React.DragEvent<HTMLDivElement>) => void
  onClick: () => void
}

export const Thumbnail = forwardRef<HTMLImageElement, ThumbnailArgs>(
  (
    {
      pageNumber,
      imageURL,
      isLoading = false,
      checked = false,
      isDragged = false,
      withBorderBottom = false,
      withBorderTop = false,
      angle = 0,
      onChange,
      onDragStart,
      onDragEnd,
      onDragOver,
      onDragLeave,
      onDragEnter,
      onDrop,
      onClick
    },
    ref
  ) => {
    if (isLoading) {
      return (
        <Stack justify="center" align="center">
          <Skeleton width={"100%"} height={160} />
          <div>{pageNumber}</div>
        </Stack>
      )
    }

    if (!imageURL) {
      return <Stack className={classes.page}>No Image URL</Stack>
    }

    let cssClassNames = []

    if (isDragged) {
      cssClassNames.push(DRAGGED)
    }

    if (withBorderBottom) {
      cssClassNames.push(BORDERLINE_BOTTOM)
    }

    if (withBorderTop) {
      cssClassNames.push(BORDERLINE_TOP)
    }

    return (
      <Stack
        ref={ref}
        align="center"
        gap={"xs"}
        draggable
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDragEnter={onDragEnter}
        onDrop={onDrop}
        className={`${classes.thumbnail} ${cssClassNames.join(" ")}`}
      >
        <Checkbox
          onChange={onChange}
          checked={checked}
          className={classes.checkbox}
        />
        <img
          onClick={onClick}
          style={{transform: `rotate(${angle}deg)`}}
          src={imageURL}
        />
        <div>{pageNumber}</div>
      </Stack>
    )
  }
)

// Add a displayName to help with debugging in React DevTools
Thumbnail.displayName = "Thumbnail"

export default Thumbnail
