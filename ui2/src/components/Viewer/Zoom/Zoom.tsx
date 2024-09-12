import PanelContext from "@/contexts/PanelContext"
import {
  zoomFactorDecremented,
  zoomFactorIncremented,
  zoomFactorReseted
} from "@/features/ui/uiSlice"
import type {PanelMode} from "@/types"
import {Group} from "@mantine/core"
import {IconZoomIn, IconZoomOut} from "@tabler/icons-react"
import {useContext} from "react"
import {useDispatch} from "react-redux"
import classes from "./Zoom.module.css"

export default function Zoom() {
  const mode: PanelMode = useContext(PanelContext)
  const dispatch = useDispatch()

  const incZoom = () => {
    dispatch(zoomFactorIncremented(mode))
  }
  const decZoom = () => {
    dispatch(zoomFactorDecremented(mode))
  }

  const fitZoom = () => {
    dispatch(zoomFactorReseted(mode))
  }

  return (
    <Group justify={"center"} className={classes.zoom}>
      <IconZoomIn onClick={incZoom} />
      <IconZoomOut onClick={decZoom} />
      <div onClick={fitZoom}>Fit</div>
    </Group>
  )
}
