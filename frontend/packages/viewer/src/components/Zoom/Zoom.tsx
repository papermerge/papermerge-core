import {Group} from "@mantine/core"
import {IconMaximize, IconZoomIn, IconZoomOut} from "@tabler/icons-react"
import classes from "./Zoom.module.css"

interface Args {
  pageNumber: number
  pageTotal: number
  onZoomInClick?: () => void
  onZoomOutClick?: () => void
  onFitClick?: () => void
}

export default function Zoom({
  pageNumber,
  pageTotal,
  onZoomInClick,
  onZoomOutClick,
  onFitClick
}: Args) {
  return (
    <Group justify={"center"} className={classes.zoom}>
      {pageNumber} / {pageTotal}
      <IconZoomIn onClick={onZoomInClick} />
      <IconZoomOut onClick={onZoomOutClick} />
      <IconMaximize onClick={onFitClick} />
    </Group>
  )
}
