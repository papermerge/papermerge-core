import {Group} from "@mantine/core"
import {IconZoomIn, IconZoomOut} from "@tabler/icons-react"
import classes from "./Zoom.module.css"

interface Args {
  onZoomInClick?: () => void
  onZoomOutClick?: () => void
  onFitClick?: () => void
}

export default function Zoom({
  onZoomInClick,
  onZoomOutClick,
  onFitClick
}: Args) {
  return (
    <Group justify={"center"} className={classes.zoom}>
      <IconZoomIn onClick={onZoomInClick} />
      <IconZoomOut onClick={onZoomOutClick} />
      <div onClick={onFitClick}>Fit</div>
    </Group>
  )
}
