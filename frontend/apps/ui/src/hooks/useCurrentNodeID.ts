import {useAppSelector} from "@/app/hooks"
import PanelContext from "@/contexts/PanelContext"
import {selectCurrentNodeID} from "@/features/ui/uiSlice"
import type {PanelMode} from "@/types"
import {useContext} from "react"

export default function useCurrentNodeID() {
  const mode: PanelMode = useContext(PanelContext)
  const currentNodeID = useAppSelector(s => selectCurrentNodeID(s, mode))

  return currentNodeID
}
