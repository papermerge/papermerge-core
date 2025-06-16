import {Checkbox, Skeleton, Stack} from "@mantine/core"
import clsx from "clsx"
import {forwardRef} from "react"
import classes from "./Thumbnail.module.css"

interface ThumbnailArgs {
  pageNumber: number
  imageURL: string | null | undefined
  checked?: boolean
  isLoading?: boolean
  isDragged?: boolean
  withBorderTop?: boolean
  withBorderBottom?: boolean
  angle?: number
  height?: number
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
  onDragStart?: () => void
  onDragEnd?: () => void
  onDragOver?: (event: React.DragEvent<HTMLDivElement>) => void
  onDragLeave?: (event: React.DragEvent<HTMLDivElement>) => void
  onDragEnter?: (event: React.DragEvent<HTMLDivElement>) => void
  onDrop?: (event: React.DragEvent<HTMLDivElement>) => void
  onClick?: () => void
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
      height = 160,
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
    const className = clsx(classes.thumbnail, classes.checkbox, {
      [classes.dragged]: isDragged,
      [classes.borderlineTop]: withBorderTop,
      [classes.borderlineBottom]: withBorderBottom
    })

    if (isLoading) {
      return (
        <Stack justify="center" align="center">
          <Skeleton width={"100%"} height={height} />
          <div>{pageNumber}</div>
        </Stack>
      )
    }

    if (!imageURL) {
      return <Stack className={classes.page}>No Image URL</Stack>
    }

    return (
      <Stack
        align="center"
        gap={"xs"}
        draggable
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDragEnter={onDragEnter}
        onDrop={onDrop}
        className={className}
      >
        <Checkbox
          onChange={onChange}
          checked={checked}
          className={classes.checkbox}
        />
        <img
          ref={ref}
          onClick={onClick}
          style={{
            transform: `rotate(${angle}deg)`
          }}
          src={imageURL}
          alt={`Thumbnail for page ${pageNumber}`}
        />
        <div>{pageNumber}</div>
      </Stack>
    )
  }
)

// Add a displayName to help with debugging in React DevTools
Thumbnail.displayName = "Thumbnail"

export default Thumbnail
