import {useContext} from "react"
import {useDispatch} from "react-redux"
import {Group} from "@mantine/core"
import {IconZoomIn, IconZoomOut} from "@tabler/icons-react"
import classes from "./Zoom.module.css"
import PanelContext from "@/contexts/PanelContext"
import type {PanelMode} from "@/types"
import {
  incZoomFactor,
  decZoomFactor,
  fitZoomFactor
} from "@/slices/dualPanel/dualPanel"

export default function Zoom() {
  const mode: PanelMode = useContext(PanelContext)
  const dispatch = useDispatch()

  const incZoom = () => {
    dispatch(incZoomFactor(mode))
  }
  const decZoom = () => {
    dispatch(decZoomFactor(mode))
  }

  const fitZoom = () => {
    dispatch(fitZoomFactor(mode))
  }

  return (
    <Group justify={"center"} className={classes.zoom}>
      <IconZoomIn onClick={incZoom} />
      <IconZoomOut onClick={decZoom} />
      <div onClick={fitZoom}>Fit</div>
    </Group>
  )
}
