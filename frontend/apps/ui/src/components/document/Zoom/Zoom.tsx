import {useAppSelector} from "@/app/hooks"
import {
  MAX_ZOOM_FACTOR,
  MIN_ZOOM_FACTOR,
  ZOOM_FACTOR_INIT,
  ZOOM_FACTOR_STEP
} from "@/cconstants"
import {usePanel} from "@/features/ui/hooks/usePanel"
import {
  selectPanelAllCustom,
  setPanelCustomState
} from "@/features/ui/panelRegistry"
import {useDispatch} from "react-redux"
import {Zoom} from "viewer"

interface Args {
  pageNumber: number
  pageTotal: number
}

const ZOOM_FACTOR_KEY = "zoomFactor"

export default function ZoomContainer({pageNumber, pageTotal}: Args) {
  const {panelId} = usePanel()
  const {zoomFactor} = useAppSelector(s => selectPanelAllCustom(s, panelId))

  const dispatch = useDispatch()

  const incZoom = () => {
    const zoom = zoomFactor || ZOOM_FACTOR_INIT
    const newValue = zoom + ZOOM_FACTOR_STEP
    if (newValue < MAX_ZOOM_FACTOR) {
      dispatch(
        setPanelCustomState({panelId, key: ZOOM_FACTOR_KEY, value: newValue})
      )
    }
  }
  const decZoom = () => {
    const zoom = zoomFactor || ZOOM_FACTOR_INIT
    const newValue = zoom - ZOOM_FACTOR_STEP
    if (newValue > MIN_ZOOM_FACTOR) {
      dispatch(
        setPanelCustomState({panelId, key: ZOOM_FACTOR_KEY, value: newValue})
      )
    }
  }

  const fitZoom = () => {
    dispatch(
      setPanelCustomState({
        panelId,
        key: ZOOM_FACTOR_KEY,
        value: ZOOM_FACTOR_INIT
      })
    )
  }

  return (
    <Zoom
      pageNumber={pageNumber}
      pageTotal={pageTotal}
      onFitClick={fitZoom}
      onZoomInClick={incZoom}
      onZoomOutClick={decZoom}
    />
  )
}
