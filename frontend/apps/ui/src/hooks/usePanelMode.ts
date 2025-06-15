import PanelContext from "@/contexts/PanelContext"
import type {PanelMode} from "@/types"
import {useContext} from "react"

export default function usePanelMode(): PanelMode {
  const mode: PanelMode = useContext(PanelContext)

  return mode
}
