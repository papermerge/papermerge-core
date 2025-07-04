import PanelContext from "@/contexts/PanelContext"
import {
  zoomFactorDecremented,
  zoomFactorIncremented,
  zoomFactorReseted
} from "@/features/ui/uiSlice"
import type {PanelMode} from "@/types"
import {useContext} from "react"
import {useDispatch} from "react-redux"
import {Zoom} from "viewer"

interface Args {
  pageNumber: number
  pageTotal: number
}

export default function ZoomContainer({pageNumber, pageTotal}: Args) {
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
    <Zoom
      pageNumber={pageNumber}
      pageTotal={pageTotal}
      onFitClick={fitZoom}
      onZoomInClick={incZoom}
      onZoomOutClick={decZoom}
    />
  )
}
