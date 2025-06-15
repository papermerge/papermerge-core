import {useAppSelector} from "@/app/hooks"
import PanelContext from "@/contexts/PanelContext"
import {
  selectCurrentNodeCType,
  selectCurrentNodeID
} from "@/features/ui/uiSlice"
import type {PanelMode} from "@/types"
import {useContext} from "react"

export default function useCurrentNode() {
  const mode: PanelMode = useContext(PanelContext)
  const currentNodeID = useAppSelector(s => selectCurrentNodeID(s, mode))
  const currentCType = useAppSelector(s => selectCurrentNodeCType(s, mode))

  return {currentNodeID, currentCType}
}
