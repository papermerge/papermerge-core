import {useAppSelector} from "@/app/hooks"
import PanelContext from "@/contexts/PanelContext"
import {selectCommanderViewOption} from "@/features/ui/uiSlice"
import {useContext} from "react"

import DocumentsByTypeCommander from "./DocumentsByTypeCommander"
import NodesCommander from "./NodesCommander"

export default function Commander() {
  const mode = useContext(PanelContext)
  const viewOption = useAppSelector(s => selectCommanderViewOption(s, mode))

  if (viewOption == "list" || viewOption == "tile") {
    return <NodesCommander />
  }

  return <DocumentsByTypeCommander />
}
